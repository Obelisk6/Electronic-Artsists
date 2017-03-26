 $(document).keydown(function(e){
        if (e.keyCode == 81) {
            document.getElementById('kick').play();
            return false;
        }
    });