============
Libro de IGIC
============

Módulo que calcula el libro de IGIC español.

Esto módulo introduce el menú "Libro de IGIC" en Contabilidad -> Informe ->
Declaraciones ATC -> Libro de IGIC.

Es posible visualizar e imprimir por separado:

* Libro Registro de Facturas Emitidas
* Libro Registro de Facturas Recibidas

Es posible exportar los registros a archivo con extensión xlsx.

En el modo de visualización de los informes es posible navegar a los asientos
contables relacionados con la factura.

**Table of contents**

.. contents::
   :local:

Installation
============

Para instalar este modulo necesitas:

* account
* base_vat
* l10n_es
* l10n_es_atc
* l10n_es_aeat
* report_xlsx

Se instalan automáticamente si están disponibles en la lista de addons.

Consideraciones adicionales:

* Es importante que en facturas que deban aparecer en los libros registros,
  no sujetos a IGIC, informar el tipo de IGIC 'No Sujeto' en facturas. Para
  evitar que los usuarios olviden informarlo es recomendable instalar el
  módulo 'account_invoice_tax_required', disponible en
  `account_invoice_tax_required <https://github.com/OCA/account-financial-
  tools/tree/12.0>`_.

Configuration
=============

Los códigos de impuestos incluidos en el Libro de IGIC pueden verse en:
Contabilidad -> Configuración -> ATC -> Mapeo atc libro de IGIC

Los clientes utilizados para ventas por caja deben tener marcado el campo
"atc - Cliente anónimo" para que no se muestren advertencias por no tener NIF
informado siguiendo lo especificado en el formato BOE.

Usage
=====

#. Ve a *Contabilidad > Declaraciones ATC > Libro de IGIC*.
#. Crea un nuevo registro.
#. Escoge el periodo de tiempo para el libro.
#. Pulsa en "Calcular".
#. Escoge la opción de visualización o impresión preferida.

Known issues / Roadmap
======================

Funcionalidades del Libro Registro de IGIC no incluídas por el momento:

* Criterio de caja
* Regímenes especiales de seguros, de agencias de viaje o de bienes usados.

Credits
=======

Authors
~~~~~~~

* Nicolás Ramos
* Binhex System Solutions
