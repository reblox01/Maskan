import io
from django.utils import timezone
from django.http import HttpResponse
from django.db import models
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.properties.models import Property
from .models import Contract
from .serializers import ContractSerializer

try:
    from reportlab.lib.pagesizes import A4
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import cm
    from reportlab.lib import colors
    HAS_REPORTLAB = True
except ImportError:
    HAS_REPORTLAB = False


class ContractListView(APIView):

    def get(self, request):
        user = request.user
        if user.role == "admin":
            contracts = Contract.objects.all()
        else:
            contracts = Contract.objects.filter(
                models.Q(vendeur=user) | models.Q(acquereur=user)
            )
        serializer = ContractSerializer(contracts, many=True)
        return Response(serializer.data)

    def post(self, request):
        property_id = request.data.get("property")
        acquereur_id = request.data.get("acquereur")
        contract_type = request.data.get("contract_type", "sale")
        agreed_price = request.data.get("agreed_price")
        notes = request.data.get("notes", "")

        try:
            property_obj = Property.objects.get(pk=property_id)
        except Property.DoesNotExist:
            return Response({"error": "Bien non trouvé"}, status=status.HTTP_404_NOT_FOUND)

        if property_obj.agent != request.user and request.user.role != "admin":
            return Response({"error": "Vous n'êtes pas le propriétaire de ce bien"}, status=status.HTTP_403_FORBIDDEN)

        from django.contrib.auth import get_user_model
        User = get_user_model()
        try:
            acquereur = User.objects.get(pk=acquereur_id)
        except User.DoesNotExist:
            return Response({"error": "Acquéreur non trouvé"}, status=status.HTTP_404_NOT_FOUND)

        contract = Contract.objects.create(
            property=property_obj,
            vendeur=request.user if request.user.role != "admin" else property_obj.agent,
            acquereur=acquereur,
            contract_type=contract_type,
            agreed_price=agreed_price,
            notes=notes,
        )

        serializer = ContractSerializer(contract)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ContractDetailView(APIView):

    def get(self, request, pk):
        try:
            contract = Contract.objects.get(pk=pk)
        except Contract.DoesNotExist:
            return Response({"error": "Contrat non trouvé"}, status=status.HTTP_404_NOT_FOUND)
        serializer = ContractSerializer(contract)
        return Response(serializer.data)


class ContractSignView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        try:
            contract = Contract.objects.get(pk=pk)
        except Contract.DoesNotExist:
            return Response({"error": "Contrat non trouvé"}, status=status.HTTP_404_NOT_FOUND)

        user = request.user

        if user == contract.vendeur:
            if contract.status != "draft":
                return Response({"error": "Le contrat a deja ete signe"}, status=status.HTTP_400_BAD_REQUEST)
            contract.status = "signed_by_vendeur"
            contract.save()
        elif user == contract.acquereur:
            if contract.status != "signed_by_vendeur":
                return Response({"error": "Le vendeur doit signer en premier"}, status=status.HTTP_400_BAD_REQUEST)
            contract.status = "completed"
            contract.save()
            self._mark_property_sold(contract)
        else:
            return Response({"error": "Vous n'etes pas concerne par ce contrat"}, status=status.HTTP_403_FORBIDDEN)

        serializer = ContractSerializer(contract)
        return Response(serializer.data)

    def _mark_property_sold(self, contract):
        prop = contract.property
        prop.status = "sold"
        prop.is_published = False
        prop.save()


class ContractPdfView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            contract = Contract.objects.get(pk=pk)
        except Contract.DoesNotExist:
            return Response({"error": "Contrat non trouvé"}, status=status.HTTP_404_NOT_FOUND)

        if not HAS_REPORTLAB:
            return Response({"error": "Generation PDF non disponible"}, status=status.HTTP_501_NOT_IMPLEMENTED)

        buf = io.BytesIO()
        doc = SimpleDocTemplate(buf, pagesize=A4)
        styles = getSampleStyleSheet()
        story = []

        from reportlab.lib.styles import ParagraphStyle
        title_style = ParagraphStyle("Title2", parent=styles["Title"], spaceAfter=12)
        story.append(Paragraph("Contrat de Vente", title_style))
        story.append(Spacer(1, 0.5 * cm))

        data = [
            ["Bien:", contract.property.title],
            ["Adresse:", f"{contract.property.address}, {contract.property.city}"],
            ["Prix:", f"{contract.agreed_price:,.2f} MAD"],
            ["Vendeur:", contract.vendeur.username],
            ["Acquereur:", contract.acquereur.username],
            ["Date:", timezone.now().strftime("%d/%m/%Y")],
        ]

        if contract.notes:
            story.append(Paragraph("Conditions:", styles["Heading2"]))
            story.append(Paragraph(contract.notes.replace("\n", "<br/>"), styles["Normal"]))
            story.append(Spacer(1, 0.3 * cm))

        table = Table(data, colWidths=[4 * cm, 10 * cm])
        table.setStyle(TableStyle([
            ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 10),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("BACKGROUND", (0, 0), (0, -1), colors.Color(0.9, 0.9, 0.9)),
        ]))
        story.append(table)
        story.append(Spacer(1, 1 * cm))
        story.append(Paragraph("Signatures:", styles["Heading2"]))
        story.append(Spacer(1, 0.5 * cm))
        story.append(Paragraph(f"Vendeur: ___________________________", styles["Normal"]))
        story.append(Spacer(1, 0.3 * cm))
        story.append(Paragraph(f"Acquereur: ___________________________", styles["Normal"]))

        doc.build(story)
        pdf_bytes = buf.getvalue()
        buf.close()

        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="contrat_{contract.id}.pdf"'
        return response
