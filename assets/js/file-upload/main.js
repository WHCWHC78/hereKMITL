$('#fileupload').fileupload({
    //add: function (e, data) {
    //    data.context = $('#submit').click(function () {
    //        data.submit();
    //    });
    //},
    done: function (e, data) {
        console.log("finushed uploading");
    },
    progressall: function (e, data) {
        var progress = parseInt(data.loaded / data.total * 100, 10);
        $('.progress-bar').css('width', progress + '%');
    }
});
//
//$('#file_file').fileupload({
//    autoUpload: true,
//    add: function (e, data) {
//        $('body').append('<p class="upl">Uploading...</p>')
//        data.submit();
//    },
//    progressall: function (e, data) {
//        var progress = parseInt(data.loaded / data.total * 100, 10);
//        $('.progress-bar').css('width', progress + '%');
//    },
//    done: function (e, data) {
//        $('.upl').remove();
//        $.each(data.files, function (index, file) {
//            /**/
//        });
//    }
//});
