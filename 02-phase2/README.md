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

![alt text](./img/image.png)

### Carga masiva de Productos

Seleccionamos el módulo de Inventory.

![alt text](./img/image-1.png)

Luego en la parte superior seleccionamos Products.

![alt text](./img/image-2.png)

En la tuerca que está a la derecha del buscador, seleccionamos Import records.

![alt text](./img/image-3.png)

Y presionamos Upload File.

![alt text](./img/image-4.png)

Luego solo mapeamos los campos correctamente y presionamos Import.

![alt text](./img/image-5.png)

Verificamos que los productos se carguen correctamente.

![alt text](./img/image-6.png)

### Carga masiva de Clientes y Proveedores

Seleccionamos el módulo de Contacts.

![alt text](./img/image-7.png)

Y repetimos el mismo proceso que con los productos.

![alt text](./img/image-8.png)

Debemos subir los archivos CSV de clientes y proveedores.

![alt text](./img/image-9.png)

Verificamos que los clientes y proveedores se carguen correctamente.

![alt text](./img/image-10.png)

Verificamos que ambos archivos se hayan cargado correctamente.

![alt text](./img/image-11.png)

## CRM y ERP

### ERP (ventas, compras, inventario)
- Settings → Users & Companies → Companies — configura tu empresa (nombre, logo, dirección)
- Settings → Accounting — activa moneda (GTQ o USD)
- Inventory → Configuration → Warehouses — verifica que exista al menos 1 almacén

![alt text](./img/image-12.png)

### CRM
- CRM — configura etapas del pipeline (ej: Nuevo → Contactado → Propuesta → Ganado)
- CRM → Configuration → Sales Teams — crea un equipo de ventas

![alt text](./img/image-13.png)

## Compras a proveedores

- Ve a Purchase → Orders → Purchase Orders → New
- Selecciona proveedor (de los importados)
- En "Products": agrega productos, cantidad y precio
- Clic Confirm Order → genera una orden de compra oficial
- Cuando llegue la mercancía: Receive Products → valida el ingreso al almacén
- Print → genera la factura del proveedor

![alt text](./img/image-14.png)

![alt text](./img/image-15.png)

![alt text](./img/image-16.png)

## Cotizaciones de Productos 

- Ve a Sales → Orders → Quotations → New
- Selecciona cliente
- Agrega productos en "Products"
- Clic Send by Email → envía al cliente / Confirm → convierte en orden de venta
- Clic en Create Invoice → genera la factura del cliente
- El flujo completo: Cotización → Orden de Venta → Entrega → Factura

![alt text](./img/image-17.png)
![alt text](./img/image-18.png)
![alt text](./img/image-19.png)
![alt text](./img/image-20.png)
![alt text](./img/image-21.png)

## Correos Electrónicos

>**Nota:** Para enviar correos electrónicos, es necesario configurar un servidor de salida SMTP activando el modo desarrollador en **"Settings → General Settings → Activate the developer mode"**.

![alt text](./img/image-22.png)

>**Nota:** Necesitamos Actividar la verificación en 2 pasos del correo que vayamos a utliizar y generar una contraseña de aplicación.

![alt text](./img/image-23.png)

Para crear la contraseña de aplicación accedemos al siguiente link:

https://myaccount.google.com/apppasswords

![alt text](./img/image-24.png)

**Configurar servidor de salida SMTP**

- Settings → Technical → Email → Outgoing Mail Servers → New
- Ejemplo con Gmail:

| Campo | Valor |
|-------|-------|
| Name | Gmail G28 (cualquier nombre descriptivo) |
| FROM Filtering | Déjalo vacío |
| Priority | 10 (valor por defecto, menor = mayor prioridad) |
| Authenticate with | Username |
| Connection Encryption | TLS (STARTTLS) |
| SMTP Server | smtp.gmail.com |
| SMTP Port | 587 (se autocompleta al elegir STARTTLS) |
| Username | tu-correo@gmail.com |
| Password | La clave de 16 caracteres del App Password |
| Debugging | Déjalo desactivado |
| SSL Certificate | No aplica con STARTTLS |

Si todo funciona bien debemos ver un mensaje de éxito a la izquierda:

![alt text](./img/image-25.png)

Vamos a crear una plantilla de correo electrónico para las cotizaciones:

- Crear una plantilla de correo
  - Ve a Settings → Technical → Email Templates
  - Clic New y llena:

| Campo | Valor |
|-------|-------|
| Name | Cotización de productos - G28 |
| Applies To | Lead/Opportunity (para CRM) |
| Subject | Cotización de productos electrónicos - {{object.name}} |
| Body | (ver abajo) |

**Cuerpo de la plantilla (Body):**

```
Estimado/a

Gracias por su interés en nuestros productos electrónicos.

Adjuntamos la cotización solicitada con los detalles de precios y disponibilidad.

Para cualquier consulta, no dude en contactarnos.

Atentamente,
Equipo de Ventas - G28 Electronics
```

![alt text](./img/image-26.png)

Enviamos el correo desde un Lead/Opportunity:

> **Nota:** Tienes que tener a un usuario con correo electrónico configurado.

![alt text](./img/image-27.png)

- Ve a CRM
- Abre o crea una oportunidad (clic New → ponle nombre y asigna un cliente)
- En el chatter (parte derecha), clic en Send message
- Aparece el compositor de correo → clic en el ícono "<->" y luego "Load a Template"
- Selecciona la plantilla que creaste → se autocompleta el asunto y cuerpo
- Verifica el destinatario (debe tener email el contacto)
- Clic Send

![alt text](./img/image-28.png)

![alt text](./img/image-29.png)

![alt text](./img/image-30.png)

![alt text](./img/image-31.png)