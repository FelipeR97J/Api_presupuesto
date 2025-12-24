# 📊 Guía de Reportes Financieros Mensuales

## 📖 Índice
- [¿Qué es el Reporte Mensual?](#qué-es-el-reporte-mensual)
- [¿Qué información incluye?](#qué-información-incluye)
- [Cómo usar el Endpoint](#cómo-usar-el-endpoint)
- [Ejemplos de Respuesta](#ejemplos-de-respuesta)
- [Interpretación de Insights](#interpretación-de-insights)

---

## 🎯 ¿Qué es el Reporte Mensual?

El **Reporte Financiero Mensual** es una herramienta poderosa que te permite obtener una "radiografía" completa de tus finanzas en un mes específico. 

No solo te muestra números fríos, sino que analiza tu comportamiento comparado con el mes anterior y te entrega **conclusiones inteligentes** (insights) sobre tus hábitos de gasto y ahorro.

---

## 📋 ¿Qué información incluye?

El reporte consolida 5 áreas clave:

1.  **💰 Resumen Ejecutivo**: Total de Ingresos, Gastos y Balance (Ahorro o Pérdida).
2.  **💳 Deudas del Mes**:
    *   **Activas**: Cuotas que estás pagando este mes.
    *   **Finalizadas**: ¡Buenas noticias! Deudas cuya última cuota pagaste este mes.
3.  **📉 Gastos Detallados**:
    *   Total por categoría (Alimentación, Transporte, etc.)
    *   Lista completa de gastos individuales.
4.  **📈 Ingresos Detallados**:
    *   Total de ingresos.
    *   Lista de fuentes de ingreso.
5.  **🧠 Insights y Comparativas**:
    *   "Te salió más cara la Luz"
    *   "Ahorraste en Supermercado"
    *   Comparación de gasto total vs mes anterior.

---

## 🔌 Cómo usar el Endpoint

### Base URL
```
http://localhost:5000
```

### 1️⃣ Obtener Reporte Mensual
```http
GET /reports/monthly?year=2025&month=12
Authorization: Bearer {token}
```

**Parámetros Requeridos:**
- `year`: Año del reporte (ej: 2025)
- `month`: Mes del reporte (1 = Enero, 12 = Diciembre)

---

## 💡 Ejemplos de Respuesta

```json
{
    "date": {
        "year": 2025,
        "month": 12,
        "start": "2025-12-01T03:00:00.000Z",
        "end": "2026-01-01T02:59:59.000Z"
    },
    
    // 1. Resumen General
    "summary": {
        "totalIncome": 1500000,
        "totalExpense": 950000,
        "balance": 550000
    },

    // 2. Estado de Deudas
    "debts": {
        "activeCount": 2,
        "finishedCount": 1,
        "activeList": [
             { "description": "PlayStation 5", "amount": 100000, "cuota": "1/6" }
        ],
        "finishedList": [
             { "description": "Zapatillas Nike", "finalDate": "2025-12-15" }
        ]
    },

    // 3. Análisis
    "insights": [
        "💰 El Balance es positivo: Ahorraste $550.000",
        "📉 Gastaste $50.000 menos que el mes anterior. ¡Bien hecho!",
        "📈 Electricidad: Te salió $5.000 más caro que el mes pasado."
    ],

    // 4. Detalle de Gastos y Comparativa
    "expenses": {
        "byCategory": {
            "Supermercado": 300000,
            "Luz": 25000
        },
        // 🆕 LISTA COMPARATIVA (Tabla ideal para Frontend)
        "comparisons": [
            {
                "category": "Supermercado",
                "currentAmount": 300000,
                "previousAmount": 350000,
                "difference": -50000,
                "percentage": "-14%"
            },
            {
                "category": "Luz",
                "currentAmount": 25000,
                "previousAmount": 20000,
                "difference": 5000,
                "percentage": "+25%"
            }
        ]
    }
}
```

---

## 🧠 Interpretación de Insights

El sistema genera frases automáticas analizando tus datos:

| Tipo de Insight | Ejemplo | Significado |
|----------------|---------|-------------|
| **Balance** | "Balance negativo de $50.000" | Gastaste más de lo que ganaste este mes. |
| **Tendencia** | "Gastaste $20.000 más que el mes anterior" | Tu nivel de gasto general subió. |
| **Ahorro Cat.** | "Supermercado: Ahorraste $10.000..." | Gastaste menos en esta categoría comparado con el mes anterior. |
| **Aumento Cat.** | "Luz: Te salió $3.000 más caro..." | Gastaste más en esta categoría. |
| **Nuevo Gasto** | "Farmacia: Este mes gastaste $15.000 (no hubo...)" | Apareció una categoría de gasto que no tenías el mes pasado. |
| **Gasto Mayor** | "En lo que más se gastó fue: Arriendo..." | Identifica tu fuga de dinero más grande del mes. |

---

## 🎓 Tips para mejores reportes

1.  **Se consistente con las categorías**: Trata de categorizar siempre igual (ej: no uses "Comida" un mes y "Almuerzo" al otro) para que las comparaciones sean precisas.
2.  **Registra todo**: Para que el balance sea real, no olvides los gastos pequeños.
3.  **Crea las deudas correctamente**: Usa el endpoint de Deudas (`/debt`) para compras en cuotas, así el reporte sabrá cuando terminan.

---

**Última actualización:** 2025-12-24
