
(function () {
    'use strict'
  
    // Fetch all the forms we want to apply custom Bootstrap validation styles to
    var forms = document.querySelectorAll('.needs-validation')

    // Loop over them and prevent submission
    Array.prototype.slice.call(forms)
      .forEach(function (form) {
        form.addEventListener('submit', function (event) {
          if (!form.checkValidity()) {
            event.preventDefault()
            event.stopPropagation()
          }
  
          form.classList.add('was-validated')
        }, false)
      })
  })()
  // enable popovers everywhere
  var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'))
  var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
    return new bootstrap.Popover(popoverTriggerEl)
  });

  // check if the user have actually selected if its RMA or not
  const logTicket = $('#logTicket');
  const requestBtn = $('#requestBtn');
  const devices = $('#devices');
  // enable the request div
  requestBtn.on('click', (e) => {
    $('#request').prop('disabled', function() {
      return !confirm("This field has to do with ticket that are not RMA. \nTickets like: \n - Configuration Request \n - Questions \n - Monitor / Activator \n - etc... \nDon't activate this if you are working with RMA, click the below for Number of Devices. \nDo you wish to continue?");
    });
  })

  devices.on('click', (e) => {
    const message = "This field has to do with Tickets that are RMA. It will activate the radio button below and the input field for number of devices. \n\nDo you wish to continue?";
    if(confirm(message)) {
      $('#numberDevices').prop('disabled', false);
      $('#warrantyYes').prop('disabled', false);
      $('#warrantyNo').prop('disabled', false);
    } else {
      $('#numberDevices').prop('disabled', true)
      $('#warrantyYes').prop('disabled', true);
      $('#warrantyNo').prop('disabled', true);
    }
  })

  logTicket.on('submit', (e) => {
    // submiting form.    
    if(($('input[name="request"').is(':disabled')) && ($('input[name="numberDevices"').is(':disabled'))) {
      alert("Please define if its a request or an RMA using the Request or Number of device button.");
      return false;
      e.preventDefault();
    } else if ($('#summary').val() == "") {
      e.preventDefault();
      alert('Please give an update on this RMA device.')
    } else {
      return true;
    }
  });

$(".alert").delay(4000).slideUp(200, function() {
    $(this).alert('close');
});
