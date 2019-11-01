let memoria = {
    guardar: (clave, valor, esPermanente) => {
        // Si el valor es de tipo objeto, lo serializo
        if (typeof valor === 'object') {
            valor = JSON.stringify(valor);
        }
        // "permanente" define si se guarda en sessionStorage o en localStorage
        if (esPermanente)
            localStorage.setItem(clave, valor);
        else
            sessionStorage.setItem(clave, valor);
    },
    obtener: (clave, esPermanente) => {
        // "permanente" define si se carga de sessionStorage o de localStorage
        let retorno;
        if (esPermanente)
            retorno = localStorage.getItem(clave);
        else
            retorno = sessionStorage.getItem(clave);
        // Como no se si es un json, pruebo a convertirlo.
        try {
            retorno = JSON.parse(retorno);
        } catch (error) {
        }
        return retorno;
    },
    borrar: (clave, esPermanente) => {
        // "permanente" define si se borra del sessionStorage o del localStorage
        if (esPermanente)
            localStorage.removeItem(clave);
        else
            sessionStorage.removeItem(clave);
    },
};

let pintor = {
    crearDesplegable: (desplegableJquery, datos, enlaceValor, enlaceTexto, valorSeleccionado = 0, crearSeleccionar) => {
        if (typeof (datos) === 'string') {
            datos = JSON.parse(datos);
        }
        // Inflado del html
        let html = '';
        if (!datos) { // Viene undefined
            html += '<option value="0">Error</option>';
            desplegableJquery.html(html);
            desplegableJquery.prop('disabled', true);
        } else if (datos.length === 0) { // No hay nada
            html += '<option value="-1">Sin resultados</option>';
            desplegableJquery.html(html);
            desplegableJquery.prop('disabled', true);
        } else { // Hay datos
            if (crearSeleccionar) {
                if (valorSeleccionado == 0)
                    html += '<option value="0" selected="selected">';
                else
                    html += '<option value="0">';
                html += 'Seleccionar</option>';
            }
            for (let i = 0; i < datos.length; i++) {
                if (datos[i][enlaceValor] === valorSeleccionado)
                    html += '<option value="' + datos[i][enlaceValor] + '" selected="selected">';
                else
                    html += '<option value="' + datos[i][enlaceValor] + '">';
                html += datos[i][enlaceTexto] + '</option>';
            }
            desplegableJquery.html(html);
            desplegableJquery.prop('disabled', false);
        }
    },
};

let backend = {
    /*_ajax: (funcion, datos, callback) => {

    },*/
    obtenerUsuarios: (callback) => {
        $.ajax({
            url: memoria.obtener('servidorIp', true) + 'users',
            success: function(datos){
                callback(datos)
            },
            error: function(){

            },
            timeout: 3000
        });
    },
    obtenerSemana: (semanaNumero, callback) => {
        if (semanaNumero === undefined)
            semanaNumero = '';
        $.ajax({
            url: memoria.obtener('servidorIp', true) + 'week/read/' + semanaNumero,
            success: function(datos){
                callback(datos);
            },
            error: function(){
                callback();
            },
            timeout: 3000
        });
    },
    obtenerCategorias: (callback) => {
        $.ajax({
            url: memoria.obtener('servidorIp', true) + 'categories',
            success: function(datos){
                callback(datos)
            },
            error: function(){

            },
            timeout: 3000
        });
    },
    agregarSello: (numeroSemana, numeroDiaDeSemana, categoriaId, usuarioId, callback) => {
        $.ajax({
            url: memoria.obtener('servidorIp', true) + `week/write/${numeroSemana}/${numeroDiaDeSemana}/${categoriaId}/${usuarioId}`,
            success: function(datos){
                callback(datos)
            },
            error: function(){
                callback()
            },
            timeout: 3000
        });
    },
    borrarSello: (numeroSemana, numeroDiaDeSemana, categoriaId, usuarioId, callback) => {
        if (confirm('¿Seguro que quieres borrar ese registro?')) {
            $.ajax({
                url: memoria.obtener('servidorIp', true) + `week/delete/${numeroSemana}/${numeroDiaDeSemana}/${categoriaId}/${usuarioId}`,
                success: function(datos){
                    callback(datos)
                },
                error: function(){
                    callback()
                },
                timeout: 3000
            });
        }
    }
};