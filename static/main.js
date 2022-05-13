function ticketStatusTag(ticket) {
  let info = ticket_manager.getRenderInfoForStatus(ticket.status);
  let tag = $('<span>');
  tag.text(ticket.status);
  tag.addClass('ticket-status-tag');
  tag.css('background-color', info.color);
  return tag
}

function hoverHelpIcon(helptext) {
  return $('<span>').addClass('material-icons-outlined help-icon').text('info');
}

function generateUrlFromTickets(ticket_array) {
  if (ticket_array === undefined) {
    return null;
  }
  return window.location.origin + window.location.pathname + '?t=' + ticket_array.join(',');
}

function createTableRow(ticket = undefined, lost_uuid = undefined) {
  if (ticket === undefined && lost_uuid === undefined) { // Return a title row
    return $('<tr>').addClass('ticket-list-header')
      .append($('<th>').text('Priority').addClass('debug'))
      .append($('<th>').text('Ticket'))
      .append($('<th>').text('Type'))
      .append($('<th>').text('Status'))
      .append($('<th>').text('Que Position').append(hoverHelpIcon('helptext')))
      .append($('<th>').text('Total Cost'));
  } else if (ticket === undefined && lost_uuid !== undefined) { // The ID was unknown
    return $('<tr>').addClass('ticket-list-row unknown-ticket')
      .append($('<td>').addClass('ticket-priority debug'))
      .append($('<td>').addClass('ticket-id').text(lost_uuid))
      .append($('<td>').addClass('ticket-list-error').attr('colspan', 4).text('Ticket not found in our system or not yet processed.'));
  }
  else { // Normal ticket
    let row;
    row = $('<tr>').addClass('ticket-list-row')
      .append($('<td>').addClass('ticket-priority debug').text(ticket.priority))
      .append($('<td>').addClass('ticket-id').text(ticket.uuid))
      .append($('<td>').addClass('ticket-type').text(ticket.printer_type))
      .append($('<td>').addClass('ticket-status').append(ticketStatusTag(ticket)))
      .append($('<td>').addClass('ticket-que'))
      .append($('<td>').addClass('ticket-cost').text(ticket.cost));

    if (ticket.cost[0] !== '$')
      row.children('.ticket-cost').addClass('empty');

    if (ticket.is_waiting) {
      row.children('.ticket-que').append($('<span>').text(ticket.que_position)).append($('<span>').text(` / ${ticket_manager.getTotalWaitingTickets(ticket.printer_type)}`));
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

  tickets = ticket_manager.getTickets(found_tickets);

  for (let t = 0; t < unknown_tickets.length; t++) {
    container.append(createTableRow(undefined, unknown_tickets[t]));
  }
  for (let t = 0; t < found_tickets.length; t++) {
    container.append(createTableRow(tickets[found_tickets[t]]));
  }
}

function getNewTickets(evt, is_automatic = false) {
  let ticket_request = evt.target.value;
  ticket_request = ticket_request.split(/[\s,]+/);
  ticket_request = ticket_request.filter((str) => { return str.length > 0 });

  var url = generateUrlFromTickets(ticket_request);
  $('#ticket-url-box').val(url);
  if (!is_automatic) {
    window.history.pushState(null, document.title, url); // Sets the URL to the desired URL, but it messes with the back button
  }
  ticket_manager.findTickets(ticket_request, true).then(ticket_indexes => updateTicketDomList(ticket_indexes));
}

function initialize() {
  $('#ticket-id-box').change((evt) => getNewTickets(evt));
  $('#ticket-id-box').on('automaticChange', (evt) => getNewTickets(evt, true));
  $('#ticket-id-box').keydown(function (evt) {
    if (evt.key === 'Enter') {
      $(this).blur();
      return false;
    }
    return true;
  });

  $('#ticket-info-table').empty().append(createTableRow());

  $('#ticket-url-box').on('focus', (evt) => evt.target.select());

  const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
  });

  if (params.t !== null) {
    $('#ticket-id-box').val(params.t).trigger('automaticChange');
  }
}

document.onreadystatechange = function () {
  if (document.readyState == "complete") {
    initialize();
  }
}
