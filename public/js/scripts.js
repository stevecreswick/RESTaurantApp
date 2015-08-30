console.log('...loaded');

$( document ).ready(function() {
  $(".dropdown-button").dropdown();
  $('select').material_select();
  $('.collapsible').collapsible({
     accordion : false // A setting that changes the collapsible behavior to expandable instead of the default accordion style
   });

   // the "href" attribute of .modal-trigger must specify the modal ID that wants to be triggered
   $('.modal-trigger').leanModal();



  //check Time Elapsed on Orders
  checkTimes();

  //check if Bill is paid
  checkBillPaid();
  colorBillGreen();

});


function checkTimes() {
  orders = $('.ordertime');
  for (var i = 0; i < orders.length; i++) {
    singleOrderTime = orders.eq(i).data('time');
    orderActive = orders.eq(i).data('active');

    if (orderActive === true) {
      if (singleOrderTime > 15){
        orders.eq(i).css({'backgroundColor': 'red'});
      } else if (singleOrderTime > 10) {
        orders.eq(i).css({'backgroundColor': 'pink'});
      } else if (singleOrderTime > 5) {
        orders.eq(i).css({'backgroundColor': 'lightyellow'});
      } else
        console.log(orders.eq(i).data('time'));
      }
    }
};

function checkBillPaid(){
  partyBill = $('.party-bill');

  for (var i = 0; i < partyBill.length; i++) {
    singleBill = partyBill.eq(i).data('paid');
    onScreenElement = partyBill.eq(i);

    if (singleBill === true){
      colorBillGreen(onScreenElement);
      console.log(onScreenElement)
    } else if (singleBill === false) {
      colorBillRed(onScreenElement);
      console.log(onScreenElement)

    }
  }

}

function colorBillGreen(singleBill) {
      console.log(singleBill);
      singleBill.css({'color': 'green'});
};

function colorBillRed(singleBill) {
      console.log(singleBill);
      singleBill.css({'color': 'red'});
};
