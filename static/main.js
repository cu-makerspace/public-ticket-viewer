function updateTicketDomList(ticket_indexes) {
  container = $('#ticket-info-box').empty();

  found_tickets = ticket_indexes['found'];
  unknown_tickets = ticket_indexes['not_found'];

  getAllTickets().then((all_tickets) => {
    for (let t = 0; t < found_tickets.length; t++) {
      ticket = all_tickets[found_tickets[t]];
      list_item = $('<li>')
        .append($('<span>').text(`${ticket.uuid}: `))

      list_item.append($('<span>').text(`Status: ${ticket.status}`));

      if (statusIsWaiting(ticket.status)) {
        // list_item.append(`, `);
        list_item.append($('<span>').text(` (behind ${found_tickets[t] + 1} of ${getTotalWaitingTickets() + 1} prints.)`));
      }

      container.append(list_item);
    }
    console.log(unknown_tickets);
    for (let t = 0; t < unknown_tickets.length; t++) {
      list_item = $('<li>')
        .append($('<span>').text(`${unknown_tickets[t]} not found. It may have not been registered in our system yet.`))
      container.append(list_item);
    }
  })
}

function getNewTickets(evt) {
  let ticket_request = evt.target.value;
  ticket_request = ticket_request.split(/[\s,]+/);
  ticket_request = ticket_request.filter((str) => { return str.length > 0 });
  findTickets(ticket_request).then(ticket_indexes => updateTicketDomList(ticket_indexes));
}

function initialize() {
  $('#ticket-id-box').change((evt) => getNewTickets(evt));
}

document.onreadystatechange = function () {
  if (document.readyState == "complete") {
    initialize();
  }
}