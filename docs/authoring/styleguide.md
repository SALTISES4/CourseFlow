## Vertical spacing inside functions

Do not compress entire function bodies into one continuous block.

Use single blank lines to separate **logical phases** inside a function body so control flow is visually legible.

Typical phases include:
1. request/context extraction
2. service construction or dependency lookup
3. guard clauses / authorization checks
4. primary business operation
5. response mapping / return

### Preferred

```python
@router.get("/{project_uuid}/graph", response=ProjectGraphViewOut, auth=BearerAuth())
def get_project_graph(request, project_uuid: UUID):
    current_user = get_current_user(request)
    svc = get_project_service()
    dto = svc.get_by_uuid(project_uuid)

    if dto is None:
        raise HttpError(404, "Project not found")

    if dto.owner_id != current_user.id:
        raise HttpError(403, "Forbidden")

    view = get_project_graph_view_service()
    payload = view.get_by_project_uuid(project_uuid)

    if payload is None:
        raise HttpError(404, "Project not found")

    return payload
````

### Acceptable

```python
@router.post("", response=ProjectDetailOut, auth=BearerAuth())
def create_project(request, payload: ProjectCreateIn):
    current_user = get_current_user(request)
    svc = get_project_service()

    dto = svc.create(
        owner_id=current_user.id,
        title=payload.title,
        description=payload.description,
        is_published=payload.is_published,
        is_template=payload.is_template,
    )

    return ProjectDetailOut(
        id=dto.id,
        uuid=dto.uuid,
        title=dto.title,
        description=dto.description,
        is_published=dto.is_published,
        is_template=dto.is_template,
        owner_id=dto.owner_id,
        date_created=dto.date_created,
        modified_on=dto.modified_on,
    )
```

### Avoid

```python
def example():
    a = build_a()
    b = build_b()
    result = do_work(a, b)
    if result is None:
        raise ValueError("Missing result")
    return format_result(result)
```

### Rule intent

Blank lines inside functions are not decorative. They should mark a boundary between distinct workflows of thought.

Use a blank line when:

* moving from setup to execution
* moving from retrieval to validation
* moving from authorization to business logic
* moving from business logic to response serialization

Do not use blank lines when statements are part of one uninterrupted micro-sequence.

### Enforcement notes

Ruff does not reliably enforce this style. Treat it as a **human readability rule** and an **LLM code-generation rule**, not a formatter-guaranteed invariant.

When generating or editing Python code, prefer preserving or introducing logical vertical spacing even if the formatter does not require it.

````

I would also add one short companion rule nearby:

```md
### Function body density

Prefer short, visually chunked function bodies over dense vertical compression.

If a function contains multiple responsibilities and requires many spacing breaks to stay readable, consider extracting helper functions or moving logic into a service layer.
````
