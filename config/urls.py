from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),

    # API v1
    path('api/v1/', include([
        path('auth/', include('apps.accounts.urls')),
        path('tenants/', include('apps.tenants.urls')),

        # SAT
        path('sat/', include('apps.sat.urls')),
        path('cfdis/', include('apps.sat.cfdi_urls')),
        path('cfdis/', include('apps.sat.cfdi_action_urls')),
        path('expenses/', include('apps.sat.expense_urls')),
        path('sales/', include('apps.sat.sales_urls')),
        path('receivables/', include('apps.sat.receivables_urls')),

        # Customers, Products, Vendors
        path('customers/', include('apps.customers.urls')),
        path('products/', include('apps.products.urls')),
        path('vendors/', include('apps.vendors.urls')),

        # Quotations
        path('quotations/', include('apps.quotations.urls')),
        path('quotations/public/', include('apps.quotations.public_urls')),

        # Tickets (expense parsing)
        path('tickets/', include('apps.tickets.urls')),

        # Chat, Notifications, Dashboard
        path('chat/', include('apps.chat.urls')),
        path('notifications/', include('apps.notifications.urls')),
        path('dashboard/', include('apps.dashboard.urls')),
    ])),
]
