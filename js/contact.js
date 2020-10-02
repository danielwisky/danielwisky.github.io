$(function() {

    // floating label headings for the contact form
    $("body").on("input propertychange", ".floating-label-form-group", function(e) {
        $(this).toggleClass("floating-label-form-group-with-value", !!$(e.target).val());
    }).on("focus", ".floating-label-form-group", function() {
        $(this).addClass("floating-label-form-group-with-focus");
    }).on("blur", ".floating-label-form-group", function() {
        $(this).removeClass("floating-label-form-group-with-focus");
    });

    $("#contactForm").validate({
        rules: {
            nome: "required",
            _replyto: {
                required: true,
                email: true
            },
            mensagem: "required"
        },
        messages: {
            nome: "Campo é obrigatório",
            _replyto: "Por favor insira um endereço de email válido",
            mensagem: "Campo é obrigatório"
        },
        errorElement: "span",
        errorPlacement: function(error, element) {
            // Add the 'help-block' class to the error element
            error.addClass("help-block");

            if (element.prop("type") === "checkbox") {
                error.insertAfter(element.parent("label"));
            } else {
                error.insertAfter(element);
            }
        },
        highlight: function(element, errorClass, validClass) {
            $(element).parents(".col-xs-12").addClass("has-error").removeClass("has-success");
        },
        unhighlight: function(element, errorClass, validClass) {
            $(element).parents(".col-xs-12").addClass("has-success").removeClass("has-error");
        }
    });

});