function ticketStatusTag(ticket) {
  let tag = $('<span>');
  tag.text(ticket.status);
  tag.addClass('ticket-status');
  return tag
}

function createTableRow(ticket = undefined, lost_uuid = undefined) {
  if (ticket === undefined && lost_uuid === undefined) { // Return a title row
    return $('<tr>').addClass('ticket-list-header')
      .append($('<th>').text('Timestamp').addClass('debug'))
      .append($('<th>').text('Priority').addClass('debug'))
      .append($('<th>').text('Ticket'))
      .append($('<th>').text('Type'))
      .append($('<th>').text('Status'))
      .append($('<th>').text('Que Position'))
      .append($('<th>').text('Total Cost'));
  } else if (ticket === undefined && lost_uuid !== undefined) { // The ID was unknown
    return $('<tr>').addClass('ticket-list-row unknown-ticket')
      .append($('<td>').addClass('ticket-timestamp debug'))
      .append($('<td>').addClass('ticket-priority debug'))
      .append($('<td>').addClass('ticket-id').text(lost_uuid))
      .append($('<td>').addClass('ticket-type'))
      .append($('<td>').addClass('ticket-status'))
      .append($('<td>').addClass('ticket-que'))
      .append($('<td>').addClass('ticket-cost'));
  }
  else { // Normal ticket
    let row;
    row = $('<tr>').addClass('ticket-list-row')
      .append($('<td>').addClass('ticket-timestamp debug').text(ticket.timestamp))
      .append($('<td>').addClass('ticket-priority debug').text(ticket.priority))
      .append($('<td>').addClass('ticket-id').text(ticket.uuid))
      .append($('<td>').addClass('ticket-type').text(ticket.printer_type))
      .append($('<td>').addClass('ticket-status').append(ticketStatusTag(ticket)))
      .append($('<td>').addClass('ticket-que'))
      .append($('<td>').addClass('ticket-cost').text(ticket.cost));

    if (ticket.cost[0] !== '$')
      row.children('.ticket-cost').addClass('empty');

    if (ticket.is_waiting) {
      row.children('.ticket-que').append($('<span>').text(ticket.que_position)).append($('<span>').text(` / ${ultimaker_tickets.getTotalWaitingTickets(ticket.printer_type)}`));
      row.addClass('waiting');
    }

    return row;
  }
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
    container.append(createTableRow(undefined, unknown_tickets[t]));
  }
}

function getNewTickets(evt) {
  let ticket_request = evt.target.value;
  ticket_request = ticket_request.split(/[\s,]+/);
  ticket_request = ticket_request.filter((str) => { return str.length > 0 });
  ultimaker_tickets.findTickets(ticket_request, true).then(ticket_indexes => updateTicketDomList(ticket_indexes));
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
