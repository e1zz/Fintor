from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import Product
from .serializers import ProductSerializer
from .services import ProductCatalogService

product_service = ProductCatalogService()


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def product_search_view(request):
    term = request.GET.get('q', '')
    limit = int(request.GET.get('limit', 10))
    products = product_service.search_for_autocomplete(
        request.user.tenant_id, term, limit
    )
    serializer = ProductSerializer(products, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def product_create_view(request):
    serializer = ProductSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save(tenant=request.user.tenant)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def product_update_view(request, id):
    product = Product.objects.get(id=id, tenant=request.user.tenant)
    serializer = ProductSerializer(product, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(ProductSerializer(product).data)
