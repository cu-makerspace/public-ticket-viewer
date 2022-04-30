function createTableRow(ticket) {
  if (ticket === undefined || ticket === null) {
    // Return a title row
    return $('<tr>').addClass('ticket-list-header')
      .append($('<th>').text('Ticket'))
      .append($('<th>').text('Type'))
      .append($('<th>').text('Status'))
      .append($('<th>').text('Que Position'))
      .append($('<th>').text('Total Cost'));
  }
  let row = $('<tr>').addClass('ticket-list-row')
    .append($('<td>').addClass('ticket-id').text(ticket.uuid))
    .append($('<td>').addClass('ticket-type').text(ticket.type))
    .append($('<td>').addClass('ticket-status').text(ticket.status))
    .append($('<td>').addClass('ticket-que'))
    .append($('<td>').addClass('ticket-cost').text(ticket.cost));

  if (ticket.cost[0] !== '$')
    row.children('.ticket-cost').addClass('empty');

  if (TicketUtils.isStatusWaiting(ticket.status))
    row.children('.ticket-que').append($('<span>').text(ticket.que_position)).append($('<span>').text(` / ${ultimaker_tickets.getTotalWaitingTickets(ticket.type) + 1}`));

  return row;
}


function updateTicketDomList(ticket_indexes) {
  container = $('#ticket-info-table').empty();
  container.append(createTableRow());

  found_tickets = ticket_indexes['found'];
  unknown_tickets = ticket_indexes['not_found'];

  tickets = ultimaker_tickets.getTickets(found_tickets);

  for (let t = 0; t < found_tickets.length; t++) {
    container.append(createTableRow(tickets[found_tickets[t]]));
  }
  for (let t = 0; t < unknown_tickets.length; t++) {
    list_item = $('<li>')
      .append($('<span>').text(`${unknown_tickets[t]} not found. It may have not been registered in our system yet.`))
    container.append(list_item);
  }
}

function getNewTickets(evt) {
  let ticket_request = evt.target.value;
  ticket_request = ticket_request.split(/[\s,]+/);
  ticket_request = ticket_request.filter((str) => { return str.length > 0 });
  ultimaker_tickets.findTickets(ticket_request).then(ticket_indexes => updateTicketDomList(ticket_indexes));
}

function initialize() {
  $('#ticket-id-box').change((evt) => getNewTickets(evt));


  const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
  });

  if (params.t !== null) {
    $('#ticket-id-box').val(params.t).change();
  }
}

document.onreadystatechange = function () {
  if (document.readyState == "complete") {
    initialize();
  }
}
