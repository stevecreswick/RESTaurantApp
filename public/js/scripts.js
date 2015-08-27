console.log('...loaded');

$( document ).ready(function() {
  $(".dropdown-button").dropdown();
  $('select').material_select();

  //check Time Elapsed on Orders
  checkTimes();

  //check if Bill is paid
  checkBillPaid();

});


function checkTimes() {
  orders = $('.ordertime');
  for (var i = 0; i < orders.length; i++) {
    singleOrderTime = orders.eq(i).data('time');

    if (singleOrderTime > 15){
      orders.eq(i).css({'backgroundColor': 'red'});
    } else if (singleOrderTime > 10) {
      orders.eq(i).css({'backgroundColor': 'pink'});
    } else if (singleOrderTime > 5) {
      orders.eq(i).css({'backgroundColor': 'lightyellow'});
    } else
      console.log(orders.eq(i).data('time'));
    }
};

function checkBillPaid() {

  partyBill = $('.party-bill');
  for (var i = 0; i < partyBill.length; i++) {
    singleBill = partyBill.eq(i);
    if (singleBill.data('paid') === true){
      singleBill.css({'color': 'green'});
    } else {
      console.log('not paid');
    }
  }

};
