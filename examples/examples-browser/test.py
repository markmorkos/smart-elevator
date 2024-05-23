from django.contrib.auth.models import Group, Permission

# Створення групи Менеджер
manager_group, created = Group.objects.get_or_create(name='Менеджер')

# Призначення дозволів для Менеджера
permissions = Permission.objects.filter(codename__in=['add_product', 'change_product', 'delete_product'])
manager_group.permissions.set(permissions)


