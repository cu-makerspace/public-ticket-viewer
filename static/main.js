function ticketStatusTag(ticket) {
  let info = ticket_manager.getRenderInfoForStatus(ticket.status);
  let tag = $('<span>')
    .text(ticket.status)
    .addClass('ticket-status-tag')
    .css('background-color', info.color)
    .attr('title', info.description);
  return tag
}

function hoverHelpIcon(helptext) {
  return $('<span>').addClass('material-icons-outlined help-icon').text('help_outline').attr('title', helptext);
}

function generateUrlFromTickets(ticket_array) {
  if (ticket_array === undefined) {
    return null;
  }
  return window.location.origin + window.location.pathname + '?t=' + ticket_array.join(',');
}

function createTableRow(ticket = undefined, lost_uuid = undefined) {
  if (ticket === undefined && lost_uuid === undefined) { // Return a title row
    return $('<header>').addClass('ticket-list-header')
      .append($('<div>').text('Priority').addClass('debug'))
      .append($('<div>').text('Ticket'))
      .append($('<div>').text('Type').addClass('no-mobile'))
      .append($('<div>').text('Status'))
      .append($('<div>').text('Que Position').addClass('no-mobile').append(hoverHelpIcon('The general position in the que for the specific printer type.')))
      .append($('<div>').text('Account Charge').addClass('no-mobile').append(hoverHelpIcon('The charge applied to the associated print account.')));
  } else if (ticket === undefined && lost_uuid !== undefined) { // The ID was unknown
    return $('<details>').addClass('ticket-list-row unknown-ticket')
      .append($('<summary>').addClass('ticket-summary')
        .append($('<div>').addClass('ticket-priority debug'))
        .append($('<div>').addClass('ticket-id').text(lost_uuid))
        .append($('<div>').addClass('ticket-list-error').text('Ticket not found in our system or not yet processed.'))
      );
  }
  else { // Normal ticket
    let row;
    row = $('<details>').addClass('ticket-list-row')
      .append($('<summary>').addClass('ticket-summary')
        .append($('<div>').addClass('ticket-priority debug').text(ticket.priority))
        .append($('<div>').addClass('ticket-id').text(ticket.uuid))
        .append($('<div>').addClass('ticket-type no-mobile').text(ticket.printer_type))
        .append($('<div>').addClass('ticket-status').append(ticketStatusTag(ticket)))
        .append($('<div>').addClass('ticket-que no-mobile'))
        .append($('<div>').addClass('ticket-cost no-mobile').text(ticket.cost))
      )
      .append(
        $('<ul>').addClass('ticket-detail').append(
          $('<li>').append($('<header>').text('Type'), $('<div>').addClass('ticket-type').text(ticket.printer_type)),
          $('<li>').append($('<header>').text('Account Charge'), $('<div>').addClass('ticket-cost').text(ticket.cost)),
          $('<li>').append($('<header>').text('Que Position'), $('<div>').addClass('ticket-que'))
        )
      );

    if (ticket.cost[0] !== '$')
      row.find('.ticket-cost').addClass('empty');

    if (ticket.is_waiting) {
      row.find('.ticket-que').append($('<span>').text(ticket.que_position)).append($('<span>').text(` / ${ticket_manager.getTotalWaitingTickets(ticket.printer_type)}`));
      row.addClass('waiting');
    }

    return row;
  }
}

function updateTicketDomList(ticket_indexes) {
  container = $('#ticket-info-table').empty();
  container.append($('<li>').append(createTableRow()));

  found_tickets = ticket_indexes['found'];
  unknown_tickets = ticket_indexes['not_found'];

  tickets = ticket_manager.getTickets(found_tickets);

  for (let t = 0; t < unknown_tickets.length; t++) {
    container.append($('<li>').append(createTableRow(undefined, unknown_tickets[t])));
  }
  for (let t = 0; t < found_tickets.length; t++) {
    container.append($('<li>').append(createTableRow(tickets[found_tickets[t]])));
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
