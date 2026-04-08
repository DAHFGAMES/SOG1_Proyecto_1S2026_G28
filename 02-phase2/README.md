# Manual Técnico

Esta es la versión en markdown del manual técnico.

## Requisitos previos

- Docker y Docker Compose instalados
- Acceso a la terminal del sistema

## Configuraciones previas

La estructura de carpetas es la siguiente:

```bash
02-phase2/
├── code/
│   ├── docker-compose.yml
│   ├── config/
│   │   └── odoo.conf
│   └── addons/     
└── data/
    ├── products.csv
    ├── customers.csv
    └── suppliers.csv
```

Lo que debes hacer es crear la carpeta `addons` vacía en `code/` y luego ejecutar el siguiente comando:

```bash
mkdir code/addons
```

Luego vamos a la carpeta `code/` y ejecutamos el siguiente comando:

```bash
docker-compose up -d
```

Cuando termine ejecutamos el siguiente comando:

```bash
docker-compose ps
```

y nos debe mostrar lo siguiente:

```
NAME      IMAGE     COMMAND   SERVICE   CREATED   STATUS    PORTS
g28_odoo       odoo:17.0     "/entrypoint.sh odoo"    odoo      16 minutes ago   Up 15 minutes             0.0.0.0:8069->8069/tcp, [::]:8069->8069/tcp, 8071-8072/tcp
g28_postgres   postgres:15   "docker-entrypoint.s…"   db        16 minutes ago   Up 16 minutes (healthy)   5432/tcp
```

Lo que nos indica que la versión de Odoo Community es la 17.0 y que el servicio de PostgreSQL está funcionando correctamente.

## Configuración

Debemos acceder a la interfaz web de Odoo en `http://localhost:8069` y configurar los siguientes datos:

- Master Password: admin_G28_2026
- Database: g28_db
- Email: admin@odoo.com
- Password: 12345
- Phone - Number: 1234567890
- ...

Luego debemos ingresar a Odoo directamente en la interfaz web y configurar los siguientes datos:

**You Logo**
- Email: admin@odoo.com
- Password: 12345

## Odoo

Dentro de la vista de Odoo, debemos instalar los siguientes módulos:
- Inventory
- Purchase
- Sales
- CRM
- Invoicing

![alt text](image.png)

### Carga masiva de Productos

Seleccionamos el módulo de Inventory.

![alt text](image-1.png)

Luego en la parte superior seleccionamos Products.

![alt text](image-2.png)

En la tuerca que está a la derecha del buscador, seleccionamos Import records.

![alt text](image-3.png)

Y presionamos Upload File.

![alt text](image-4.png)

Luego solo mapeamos los campos correctamente y presionamos Import.

![alt text](image-5.png)

Verificamos que los productos se carguen correctamente.

![alt text](image-6.png)

### Carga masiva de Clientes y Proveedores

Seleccionamos el módulo de Contacts.

![alt text](image-7.png)

Y repetimos el mismo proceso que con los productos.

![alt text](image-8.png)

Debemos subir los archivos CSV de clientes y proveedores.

![alt text](image-9.png)

Verificamos que los clientes y proveedores se carguen correctamente.

![alt text](image-10.png)

Verificamos que ambos archivos se hayan cargado correctamente.

![alt text](image-11.png)

## CRM y ERP

### ERP (ventas, compras, inventario)
- Settings → Users & Companies → Companies — configura tu empresa (nombre, logo, dirección)
- Settings → Accounting — activa moneda (GTQ o USD)
- Inventory → Configuration → Warehouses — verifica que exista al menos 1 almacén

### CRM
- CRM → Configuration → Stages — configura etapas del pipeline (ej: Nuevo → Contactado → Propuesta → Ganado)
- CRM → Configuration → Sales Teams — crea un equipo de ventas