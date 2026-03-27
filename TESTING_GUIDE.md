# Guía de Testing - SkyBalance

## ✅ Implementación Completada

### Backend (Python/Flask)
- ✅ CORS habilitado en `app.py` 
- ✅ 19 endpoints implementados y funcionales
- ✅ Manejo de errores consistente
- ✅ Servicios core operacionales

### Frontend (JavaScript)
- ✅ `api-client.js` - Cliente HTTP con todas las funciones
- ✅ `tree-visualizer.js` - Visualizador de árbol en canvas
- ✅ `app-main.js` - Lógica principal + event handlers
- ✅ `app.html` - Scripts cargados en orden correcto
- ✅ `index.html` - Página de entrada

---

## 🚀 Cómo Probar

### Paso 1: Iniciar Backend
```bash
cd backend
python app.py
```
✅ Deberías ver: `Running on http://127.0.0.1:5000`

### Paso 2: Abrir Frontend
Abre en el navegador:
```
file:///c:/Users/aleja/OneDrive/Escritorio/proyect_Ed_arboles/EDarboles/frontend/index.html
```

O mejor: configura un servidor HTTP local
```bash
# En la carpeta frontend, usando Python
python -m http.server 8000
# Luego abre: http://localhost:8000
```

### Paso 3: Probar Funcionalidades

#### A. Cargar Árbol desde JSON
1. Click en "Seleccionar archivo JSON"
2. Selecciona un archivo de prueba de `backend/data/`:
   - `modo_insercion.json` - Inserción de vuelos
   - `modo_topologia.json` - Árbol por topología
3. ✅ El árbol debe aparecer en el canvas

#### B. Insertar Vuelo Manual
1. En "Insertar Vuelo" rellena:
   - Código: `SB400`
   - Origen: `Bogotá`
   - Destino: `Medellín`
   - Hora: `14:30`
   - Precio: `120000`
   - Pasajeros: `150`
   - Prioridad: `2`
2. Click "Insertar"
3. ✅ Vuelo debe aparecer en el árbol

#### C. Operaciones Básicas
- **Buscar**: Ingresa código en campo + Enter
- **Eliminar**: Ingresa código + click "Eliminar Nodo"
- **Cancelar**: Ingresa código + click "Cancelar Vuelo + Descendientes"
- **Deshacer**: Click "Deshacer (Ctrl+Z)"
- **Exportar**: Click "Exportar JSON" (descarga archivo)

#### D. Visualización
- **Zoom**: Usa scroll o botones +/-
- **Pan**: Arrastra el canvas
- **Reset View**: Click botón 🔄

#### E. Recorridos
Click en botones de recorrido (InOrder, PreOrder, PostOrder, BFS):
- ✅ Debe mostrar códigos de vuelos en orden

#### F. Modo Estrés
1. Activa toggle "Modo Estrés"
2. Click "Rebalancear Todo"
3. ✅ Árbol debe rebalancearse

---

## 🔍 Verificar Consola del Navegador (F12)

### ✅ Debería ver:
```
- Fetch requests a http://localhost:5000/api/tree
- Respuestas con estructura: {status: "success", data: {...}}
- Sin errores CORS
```

### ❌ Si ves errores:
```
- "CORS error" → Verificar que CORS esté activo en app.py
- "Cannot find api-client" → Verificar que se cargan scripts en orden
- "Cannot read property 'draw'" → TreeVisualizer no se inicializó
```

---

## 📊 Archivos JSON de Prueba

### modo_insercion.json
```json
{
  "tipo": "INSERCION",
  "vuelos": [
    {
      "codigo": "SB100",
      "origen": "Bogotá",
      "destino": "Cali",
      "horaSalida": "08:00",
      "precioBase": 150000,
      "pasajeros": 200,
      "promocion": false,
      "alerta": false,
      "prioridad": 1
    }
  ]
}
```

### modo_topologia.json
- Define el árbol con estructura explícita
- Campos: "codigo", "origen", "destino", "izquierdo", "derecho", etc.

---

## 🛠️ Troubleshooting

| Problema | Solución |
|----------|----------|
| CORS error | Verifica `from flask_cors import CORS` en app.py |
| Scripts no cargan | Verifica rutas en `<script src="...">` |
| Árbol vacío al abrir | Click "Seleccionar archivo JSON" |
| Buttons no funcionan | Abre consola (F12) para ver errores |
| API retorna 400 | Verifica campos obligatorios en formulario |
| No hay visualización | Verifica que canvas div existe con id="tree-canvas" |

---

## 📋 Next Steps (Opcional)

### Si todo funciona:
- [ ] Implementar endpoint: `DELETE /api/tree/delete-low-profit` 
- [ ] Implementar endpoint: `GET /api/tree/verify-avl`
- [ ] Agregar autenticación de usuarios
- [ ] Implementar guardado persistente en BD
- [ ] Añadir búsqueda avanzada y filtros

### Testing Automático:
- Crear tests con Jest/Vitest para api-client.js
- Crear tests con PyTest para backend
- Implementar CI/CD con GitHub Actions

---

## 📞 Soporte

Si encuentras problemas:
1. Abre la consola del navegador (F12)
2. Verifica backend esté corriendo: `curl http://localhost:5000/api/tree`
3. Revisa los logs en terminal del backend
4. Prueba endpoints manualmente con Postman o curl

