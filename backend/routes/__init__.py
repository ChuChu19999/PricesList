from fastapi import APIRouter, Request
from routes import products, sections

api_router = APIRouter(prefix="/api")

api_router.include_router(sections.router, prefix="/sections", tags=("sections",))
api_router.include_router(products.router, prefix="/products", tags=("products",))


@api_router.get("/")
async def root(request: Request):
    """Информация о доступных API эндпоинтах."""
    app = request.app
    endpoints = []
    for route in app.routes:
        if hasattr(route, "path") and hasattr(route, "methods"):
            path = route.path
            if path.startswith("/api"):
                for method in route.methods:
                    if method != "HEAD":
                        endpoints.append({"method": method, "path": path})
    return {
        "message": "Товары и цены API",
        "endpoints": sorted(endpoints, key=lambda x: (x["path"], x["method"])),
        "total": len(endpoints),
    }


@api_router.get(
    "/health/",
    summary="Проверка состояния API",
    responses={200: {"description": "API работает"}},
)
async def health():
    """Проверка работоспособности API."""
    return {"status": "ok"}
