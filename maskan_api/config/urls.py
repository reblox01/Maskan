import os
import mimetypes
from django.contrib import admin
from django.http import FileResponse, Http404
from django.urls import path, include, re_path
from django.conf import settings

mimetypes.add_type("application/javascript", ".js", True)
mimetypes.add_type("text/css", ".css", True)


def frontend(request, path=""):
    file_path = os.path.join(settings.BASE_DIR, "static", path)
    if os.path.isfile(file_path):
        return FileResponse(open(file_path, "rb"))
    index_path = os.path.join(settings.BASE_DIR, "static", "index.html")
    if os.path.isfile(index_path):
        return FileResponse(open(index_path, "rb"))
    raise Http404


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("apps.accounts.urls")),
    path("api/properties/", include("apps.properties.urls")),
    path("api/favorites/", include("apps.favorites.urls")),
    path("api/contracts/", include("apps.contracts.urls")),
    re_path(r"^(?!api/)(?P<path>.*)$", frontend, name="frontend"),
]
