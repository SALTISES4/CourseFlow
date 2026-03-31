erDiagram
    USER ||--o{ PROJECT : ""
    USER ||--o{ WORKFLOW : ""
    USER ||--o{ COMMENT : ""
    USER ||--o{ NOTIFICATION : ""
    USER ||--o{ FAVORITE_PROJECT : ""
    USER ||--o{ FAVORITE_WORKFLOW : ""
    USER ||--o{ PROJECTTEAM_USER : ""

    PROJECT ||--o{ WORKFLOW : ""
    PROJECT }o--o{ DISCIPLINE : ""

    WORKFLOW ||--o{ SECTION : ""
    WORKFLOW ||--|| UNIT : ""
    WORKFLOW ||--o{ CHANNEL : ""

    SECTION ||--o{ NODE : ""
    CHANNEL ||--o{ NODE : ""

    NODE }o--o{ OUTCOME : ""
    NODE ||--o{ EDGE : ""
    NODE ||--o{ EDGE : ""
    NODE }o--o| UNIT : ""


    OUTCOME }o--|| WORKFLOW : ""
    OUTCOME ||--|| THREAD : ""
    OUTCOME ||--o{ OUTCOME_LINK : ""

    CHANNEL ||--|| THREAD : ""
    THREAD ||--o{ COMMENT : ""

    SECTION ||--|| THREAD : ""
    NODE ||--|| THREAD : ""


    PROJECT ||--o{ FAVORITE_PROJECT : ""
    WORKFLOW ||--o{ FAVORITE_WORKFLOW : ""

    PROJECT ||--|| PROJECTTEAM : ""
    PROJECTTEAM ||--o{ PROJECTTEAM_USER : ""

    PROJECT ||--o{ TAG : ""
    NODE }o--o{ TAG : ""
    OUTCOME }o--o{ TAG : ""

    UNIT ||--|| PROGRAMMETA : ""
    UNIT ||--|| COURSEMETA : ""
    UNIT ||--|| ACTIVITYMETA : ""
    UNIT ||--|| TASKMETA : ""

