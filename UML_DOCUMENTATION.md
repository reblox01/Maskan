# Maskan — UML Diagrams & Database Structure

---

## 1. Database Structure

### Entity Relationship Overview

```
┌──────────────────────┐       ┌──────────────────────┐
│        User          │       │   ApplicationField   │
├──────────────────────┤       ├──────────────────────┤
│ id          UUID (PK)│       │ id          UUID (PK)│
│ email       VARCHAR  │       │ label       VARCHAR  │
│ username    VARCHAR  │       │ field_type  VARCHAR  │
│ password    VARCHAR  │       │ placeholder VARCHAR  │
│ phone       VARCHAR  │       │ help_text   VARCHAR  │
│ role        VARCHAR  │       │ choices     JSON     │
│ is_verified BOOLEAN  │       │ is_required BOOLEAN  │
│ is_active   BOOLEAN  │       │ order       INT      │
│ avatar      TEXT     │       │ is_active   BOOLEAN  │
│ bio         TEXT     │       │ created_at  DATETIME │
│ address     VARCHAR  │       └──────────┬───────────┘
│ city        VARCHAR  │                  │
│ wilaya      VARCHAR  │                  │
│ developer_  BOOLEAN  │                  │
│ created_at  DATETIME │                  │
│ updated_at  DATETIME │                  │
└──────┬───────┬───────┘                  │
       │       │                          │
       │ 1   1 │                          │
       │       │                          │
       ▼       ▼                          │
┌──────────────────────┐       ┌──────────▼───────────┐
│     Property         │       │ AgentApplication     │
├──────────────────────┤       ├──────────────────────┤
│ id          UUID (PK)│       │ id          UUID (PK)│
│ title       VARCHAR  │       │ user_id     UUID (FK)│ 1:1
│ description TEXT     │       │ status      VARCHAR  │
│ property_   VARCHAR  │       │ admin_notes TEXT     │
│ status      VARCHAR  │       │ created_at  DATETIME │
│ price       DECIMAL  │       │ reviewed_at DATETIME │
│ currency    VARCHAR  │       │ reviewed_by UUID (FK)│
│ area_sqm    INT      │       └──────────┬───────────┘
│ bedrooms    INT      │                  │
│ bathrooms   INT      │                  │ 1
│ address     VARCHAR  │                  │
│ city        VARCHAR  │                  │
│ wilaya      VARCHAR  │                  │
│ latitude    DECIMAL  │                  ▼
│ longitude   DECIMAL  │       ┌──────────────────────┐
│ agent_id    UUID (FK)│       │ ApplicationResponse  │
│ is_published BOOLEAN │       ├──────────────────────┤
│ is_featured  BOOLEAN │       │ id          UUID (PK)│
│ created_at  DATETIME │       │ application_id UUID  │ N:1
│ updated_at  DATETIME │       │ field_id    UUID (FK)│ N:1
└──────┬───────────────┘       │ value       TEXT     │
       │ 1                     └──────────────────────┘
       │
       ▼ N
┌──────────────────────┐
│   PropertyImage      │
├──────────────────────┤
│ id          UUID (PK)│
│ property_id UUID (FK)│
│ image_data  TEXT     │  (base64)
│ image_hash  VARCHAR  │
│ order       INT      │
│ created_at  DATETIME │
└──────────────────────┘
```

---

## 2. Class Diagram (PlantUML)

```plantuml
@startuml Maskan_Class_Diagram

skinparam classAttributeIconSize 0
skinparam classFontSize 13
skinparam packageFontSize 12

package "Accounts" {
  class User {
    +id: UUID
    +email: String
    +username: String
    +password: String
    +phone: String
    +role: Enum(client|agent|admin)
    +is_verified: Boolean
    +is_active: Boolean
    +avatar: Text
    +bio: Text
    +address: String
    +city: String
    +wilaya: String
    +developer_mode: Boolean
    +created_at: DateTime
    +updated_at: DateTime
    --
    +register()
    +login()
    +logout()
    +update_profile()
    +change_password()
  }

  class ApplicationField {
    +id: UUID
    +label: String
    +field_type: Enum(text|number|textarea|select|checkbox|file)
    +placeholder: String
    +help_text: String
    +choices: JSON
    +is_required: Boolean
    +order: Integer
    +is_active: Boolean
    +created_at: DateTime
    --
    +create_field()
    +update_field()
    +reorder()
    +delete_field()
  }

  class AgentApplication {
    +id: UUID
    +user: FK(User)
    +status: Enum(pending|approved|rejected)
    +admin_notes: Text
    +created_at: DateTime
    +reviewed_at: DateTime
    +reviewed_by: FK(User)
    --
    +submit()
    +approve()
    +reject()
  }

  class ApplicationResponse {
    +id: UUID
    +application: FK(AgentApplication)
    +field: FK(ApplicationField)
    +value: Text
    --
    +save_response()
  }

  User "1" -- "1" AgentApplication : submits >
  AgentApplication "1" -- "0..*" ApplicationResponse : contains >
  ApplicationField "1" -- "0..*" ApplicationResponse : defines >
  User "1" -- "0..*" AgentApplication : reviews >
}

package "Properties" {
  class Property {
    +id: UUID
    +title: String
    +description: Text
    +property_type: Enum
    +status: Enum
    +price: Decimal
    +currency: String
    +area_sqm: Integer
    +bedrooms: Integer
    +bathrooms: Integer
    +address: String
    +city: String
    +wilaya: String
    +latitude: Decimal
    +longitude: Decimal
    +is_published: Boolean
    +is_featured: Boolean
    +created_at: DateTime
    +updated_at: DateTime
    --
    +create()
    +update()
    +delete()
    +filter_by_criteria()
    +get_map_pins()
    +get_featured()
  }

  class PropertyImage {
    +id: UUID
    +property: FK(Property)
    +image_data: Text
    +image_hash: String
    +order: Integer
    +created_at: DateTime
    --
    +upload()
    +delete()
    +reorder()
  }

  Property "1" -- "0..*" PropertyImage : has >
  User "1" -- "0..*" Property : owns(agent) >
}

@enduml
```

---

## 3. Use Case Diagram (PlantUML)

```plantuml
@startuml Maskan_Use_Case_Diagram

left to right direction
skinparam actorStyle awesome
skinparam packageStyle rectangle

actor "Client" as C
actor "Agent" as A
actor "Admin" as ADM

rectangle "Maskan Platform" {
  package "Authentication" {
    usecase "Register" as UC1
    usecase "Login" as UC2
    usecase "Logout" as UC3
    usecase "Update Profile" as UC4
    usecase "Upload Avatar" as UC5
  }

  package "Property Management" {
    usecase "Search Properties" as UC6
    usecase "View Property Details" as UC7
    usecase "Save Property" as UC8
    usecase "Filter by Criteria" as UC9
    usecase "View on Map" as UC10
    usecase "Create Property" as UC11
    usecase "Edit Property" as UC12
    usecase "Delete Property" as UC13
    usecase "Upload Property Images" as UC14
  }

  package "Agent Application" {
    usecase "Apply to Become Agent" as UC15
    usecase "Review Applications" as UC16
    usecase "Approve Application" as UC17
    usecase "Reject Application" as UC18
    usecase "Configure Application Fields" as UC19
  }

  package "Admin Dashboard" {
    usecase "View Statistics" as UC20
    usecase "Manage Users" as UC21
    usecase "Change User Role" as UC22
    usecase "Toggle Developer Mode" as UC23
    usecase "View Agent Requests" as UC24
  }
}

C --> UC1
C --> UC2
C --> UC3
C --> UC4
C --> UC5
C --> UC6
C --> UC7
C --> UC8
C --> UC9
C --> UC10
C --> UC15

A --> UC2
A --> UC3
A --> UC4
A --> UC5
A --> UC6
A --> UC7
A --> UC10
A --> UC11
A --> UC12
A --> UC13
A --> UC14
A --> UC20

ADM --> UC2
ADM --> UC3
ADM --> UC4
ADM --> UC6
ADM --> UC7
ADM --> UC10
ADM --> UC11
ADM --> UC12
ADM --> UC13
ADM --> UC14
ADM --> UC16
ADM --> UC17
ADM --> UC18
ADM --> UC19
ADM --> UC20
ADM --> UC21
ADM --> UC22
ADM --> UC23
ADM --> UC24

@enduml
```

---

## 4. Sequence Diagram — Agent Application Flow (PlantUML)

```plantuml
@startuml Agent_Application_Sequence

skinparam sequenceMessageAlign center

actor "Client" as C
participant "Frontend\n(React)" as F
participant "API\n(Django)" as API
database "Database\n(Neon PostgreSQL)" as DB
actor "Admin" as ADM

== Submit Application ==

C -> F : Clicks "Devenir agent"
activate F
F -> API : GET /api/auth/application-fields/active/
activate API
API -> DB : Query active ApplicationFields
DB --> API : Fields list
API --> F : Fields JSON
deactivate API
F --> C : Render dynamic form

C -> F : Fill form & submit
F -> API : POST /api/auth/agent-application/\n{ responses: [{field_id, value}] }
activate API
API -> API : Validate required fields
API -> DB : Create AgentApplication(status=pending)
API -> DB : Create ApplicationResponse for each field
DB --> API : Application created
API --> F : 201 Created + application detail
deactivate API
F --> C : Show "Demande envoyée" toast

== Review Application ==

ADM -> F : Navigate to "Demandes d'agent"
activate F
F -> API : GET /api/auth/applications?status=pending
activate API
API -> DB : Query pending applications
DB --> API : Applications list
API --> F : Applications JSON
deactivate API
F --> C : Show applications list

ADM -> F : Click "Approuver"
F -> F : Open confirmation dialog
ADM -> F : Confirm approval
F -> API : PATCH /api/auth/applications/{id}/\n{status: "approved"}
activate API
API -> DB : Update AgentApplication
API -> DB : Set user.role = "agent"
DB --> API : Updated
API --> F : 200 OK
deactivate API
F --> C : Show success toast + remove from list

@enduml
```

---

## 5. Sequence Diagram — Property Creation (PlantUML)

```plantuml
@startuml Property_Creation_Sequence

actor "Agent" as A
participant "Frontend\n(React)" as F
participant "LocationPicker\n(Leaflet)" as LP
participant "ImageUploader\n(React)" as IU
participant "API\n(Django)" as API
database "Database\n(Neon)" as DB

== Step 1: Type & Title ==

A -> F : Fill title, select property type
F -> F : Validate (min 5 chars, type selected)

== Step 2: Location ==

A -> F : Enter city, wilaya, address
A -> LP : Click on map to pick location
LP -> LP : navigator.geolocation.getCurrentPosition()
LP -> LP : Set marker at GPS coordinates
LP --> F : lat, lng values

== Step 3: Details & Price ==

A -> F : Enter price, area, bedrooms, bathrooms
F -> F : Validate (price > 0, area > 0)

== Step 4: Description ==

A -> F : Write description
F -> F : Show summary preview

== Step 5: Photos ==

A -> IU : Drag & drop images
IU -> IU : FileReader.readAsDataURL()
IU -> IU : Convert to base64
IU -> IU : Generate preview thumbnails
IU --> F : Array of base64 strings

== Submit ==

A -> F : Click "Publier le bien"
F -> API : POST /api/properties/\n{title, type, price, city, ..., images: [{image_data, order}]}
activate API
API -> API : Validate all fields
API -> DB : Create Property record
loop For each image
  API -> DB : Create PropertyImage(base64, hash, order)
end
DB --> API : Property created with ID
API --> F : 201 Created + property detail
deactivate API
F -> F : Show success toast
F -> F : Navigate to /properties/{id}

@enduml
```

---

## 6. Activity Diagram — Login Flow (PlantUML)

```plantuml
@startuml Login_Activity

start

:User enters email and password;
:Frontend validates inputs;

if (Fields valid?) then (no)
  :Show validation errors;
  stop
else (yes)
endif

:Frontend sends POST /api/auth/login/;
:Django receives request;

:Check rate limit (10/min per IP);

if (Rate limited?) then (yes)
  :Return 429 Too Many Requests;
  :Frontend shows "Trop de tentatives";
  stop
else (no)
endif

:Authenticate(email, password);

if (Credentials valid?) then (no)
  :Return 401 Invalid credentials;
  :Frontend shows error message;
  stop
else (yes)
endif

:Generate JWT access token (15min);
:Generate JWT refresh token (7 days);
:Set HttpOnly cookies (SameSite=Strict);
:Return 200 + user data;

:Frontend updates AuthContext;
:Navigate to dashboard;

stop

@enduml
```

---

## 7. Activity Diagram — Property Search (PlantUML)

```plantuml
@startuml Property_Search_Activity

start

:User lands on /properties page;
:Frontend reads URL params (search, type, city, price...);

:Frontend sends GET /api/properties/ with filters;

:Django receives request;

:Apply PropertyFilter;

if (Title search?) then (yes)
  :Filter title__icontains;
endif

if (Property type?) then (yes)
  :Filter property_type exact;
endif

if (City?) then (yes)
  :Filter city__icontains;
endif

if (Price range?) then (yes)
  :Filter price gte/lte;
endif

if (GPS location?) then (yes)
  :Calculate bounding box (lat ± delta, lng ± delta);
  :Filter latitude/longitude within bounds;
endif

:Filter is_published=True;
:Apply ordering (price, created_at, etc.);
:Paginate (20 per page);

:Return paginated results;

:Frontend renders;

if (View mode?) then (grid)
  :Display PropertyCard grid with stagger animation;
else (map)
  :Display Leaflet map with custom markers;
  :On marker click: show MapPropertyPopup;
endif

stop

@enduml
```

---

## 8. Activity Diagram — Agent Application Review (PlantUML)

```plantuml
@startuml Agent_Application_Review_Activity

start

:Admin opens "Demandes d'agent";
:Load pending applications list;

:Admin selects an application;
:Display user info + field responses;

if (Decision?) then (Approve)
  :Open confirmation dialog;
  :Admin confirms;
  
  :PATCH /api/applications/{id}/\n{status: "approved"};
  
  :Update AgentApplication status;
  :Update user.role = "agent";
  :Set reviewed_at = now();
  :Set reviewed_by = admin;
  
  :Return success;
  :Show toast "Demande approuvée";
  :Remove from pending list;
  
else (Reject)
  :Open rejection dialog;
  :Admin enters rejection notes;
  :Admin confirms;
  
  :PATCH /api/applications/{id}/\n{status: "rejected", admin_notes};
  
  :Update AgentApplication status;
  :Set reviewed_at = now();
  :Set reviewed_by = admin;
  
  :Return success;
  :Show toast "Demande refusée";
  :Remove from pending list;
endif

stop

@enduml
```

---

## 9. Entity Relationship Diagram (PlantUML)

```plantuml
@startuml Maskan_ERD

skinparam linetype ortho

entity "User" as U {
  * id : UUID <<PK>>
  --
  * email : VARCHAR(254) <<UNIQUE>>
  * username : VARCHAR(30)
  * password : VARCHAR(128)
  * role : VARCHAR(10) <<client|agent|admin>>
  * phone : VARCHAR(20)
  * is_verified : BOOLEAN
  * is_active : BOOLEAN
  * avatar : TEXT
  * bio : TEXT
  * address : VARCHAR(300)
  * city : VARCHAR(100)
  * wilaya : VARCHAR(100)
  * developer_mode : BOOLEAN
  * created_at : DATETIME
  * updated_at : DATETIME
}

entity "Property" as P {
  * id : UUID <<PK>>
  * title : VARCHAR(200)
  * description : TEXT
  * property_type : VARCHAR(20)
  * status : VARCHAR(10)
  * price : DECIMAL(14,2)
  * currency : VARCHAR(3)
  * area_sqm : INT
  * bedrooms : INT
  * bathrooms : INT
  * address : VARCHAR(300)
  * city : VARCHAR(100)
  * wilaya : VARCHAR(100)
  * latitude : DECIMAL(9,6)
  * longitude : DECIMAL(9,6)
  * is_published : BOOLEAN
  * is_featured : BOOLEAN
  * created_at : DATETIME
  * updated_at : DATETIME
}

entity "PropertyImage" as PI {
  * id : UUID <<PK>>
  * image_data : TEXT
  * image_hash : VARCHAR(64)
  * order : INT
  * created_at : DATETIME
}

entity "ApplicationField" as AF {
  * id : UUID <<PK>>
  * label : VARCHAR(200)
  * field_type : VARCHAR(10)
  * placeholder : VARCHAR(200)
  * help_text : VARCHAR(300)
  * choices : JSON
  * is_required : BOOLEAN
  * order : INT
  * is_active : BOOLEAN
  * created_at : DATETIME
}

entity "AgentApplication" as AA {
  * id : UUID <<PK>>
  * status : VARCHAR(10)
  * admin_notes : TEXT
  * created_at : DATETIME
  * reviewed_at : DATETIME
}

entity "ApplicationResponse" as AR {
  * id : UUID <<PK>>
  * value : TEXT
}

U ||--o{ P : "owns (agent)"
P ||--o{ PI : "has images"
U ||--|| AA : "submits"
AA ||--o{ AR : "contains"
AF ||--o{ AR : "defines"
U ||--o{ AA : "reviews (admin)"

@enduml
```

---

## How to Render These Diagrams

1. **Online**: Paste any `@startuml ... @enduml` block into [plantuml.com/plantuml](https://www.plantuml.com/plantuml)
2. **VS Code**: Install the "PlantUML" extension, then press `Alt+D` to preview
3. **CLI**: `java -jar plantuml.jar diagram.puml`
