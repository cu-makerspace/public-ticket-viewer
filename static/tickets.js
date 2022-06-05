const _SHEET_ID = '1k0ZiJ1El2J1gxfqp6boEx7E2OTiSW87pCp_c9j0jv0Q'
const _API_KEY = 'AIzaSyDHaowMtvRwFaYBH--r4utAAd6XJ5bc-6c';
const _SHEET_RANGE = "A1:E1000";
const _SHEET_NAMES = ['Ultimaker', 'Formlabs', 'Markforged']
const _CONFIG_SHEET = 'Dynamic Configuration';

class TicketUtils {
  static isStatusWaiting(status) {
    return ticket_manager.getRenderInfoForStatus(status).waiting;
    // return status.toLowerCase().includes('waiting to print')
  }
}

class TicketList {
  constructor() {
    // Build the URL from the ranges, sheet URL, and API key
    let range_requests = []
    _SHEET_NAMES.forEach(el => { range_requests.push(`ranges='${el}'!${_SHEET_RANGE}`); })
    range_requests = range_requests.join('&');
    this.__GAPI_QUERY = `https://sheets.googleapis.com/v4/spreadsheets/${_SHEET_ID}/values:batchGet?${range_requests}&ranges='${_CONFIG_SHEET}'!A2:D1000&key=${_API_KEY}`;
    // Prep data for initial data load
    this.__all_tickets = null;
    this.__all_tickets_lock = false;
    this.__number_of_waiting_tickets = 0;
    this.__status_types = null;
    this.getSpreadsheetValues()
  }
  /**
   * @returns The total number of rows that are waiting in the que to be printed.
   */
  getTotalWaitingTickets(type) {
    return this.__number_of_waiting_tickets[type];
  }

  /**
   * Filters the recived data and bring it into a more usable formats
   */
  handleNewData(data) {
    this.__all_tickets_lock = true;
    this.__all_tickets = [];
    this.__number_of_waiting_tickets = {};
    this.__processStatusTypes(data.valueRanges[data.valueRanges.length - 1]);
    for (let sheet in _SHEET_NAMES) {
      let rows = data.valueRanges[sheet].values;
      let tickets_list_temp = []
      this.__number_of_waiting_tickets[_SHEET_NAMES[sheet]] = 0;

      let column_map_temp = rows.shift();
      let column_map = {}
      for (let i = 0; i < column_map_temp.length; i++)
        column_map[column_map_temp[i]] = i

      // Process all rows in this sheet
      for (let r = 0; r < rows.length; r++) {
        let row = rows[r];
        // Remove empty/invalid rows
        if (row.length !== Object.keys(column_map).length || row[column_map['status']] === '') {
          continue;
        }
        // Convert ticket dict for readability
        tickets_list_temp.push({
          'uuid': row[column_map['uuid']],
          'priority': Number(row[column_map['priority']]),
          'status': row[column_map['status']],
          'cost': row[column_map['cost']],
          'is_waiting': TicketUtils.isStatusWaiting(row[column_map['status']]),
          'printer_type': _SHEET_NAMES[sheet]
        });

        if (TicketUtils.isStatusWaiting(row[column_map['status']]))
          this.__number_of_waiting_tickets[_SHEET_NAMES[sheet]]++;
      }

      // Que position relies on position after priority-based sorting
      tickets_list_temp.sort((a, b) => { return b.priority - a.priority });
      for (let t = 0; t < tickets_list_temp.length; t++) {
        tickets_list_temp[t]['que_position'] = t + 1;
      }

      this.__all_tickets = this.__all_tickets.concat(tickets_list_temp);
    }

    this.__all_tickets.sort((a, b) => { return b.priority - a.priority });

    this.__all_tickets_lock = false;
  }

  /**
   * Get and typecast data from the public-facing spreadsheet.
   * 
   * It is sadly not possible to query based on data (i.e. search), so instead we
   * take all available data and filter on the client.
   * 
   */
  getSpreadsheetValues() {
    return $.get({
      url: this.__GAPI_QUERY,
      type: 'GET',
      dataType: 'json',
    }).done((data) => { this.handleNewData(data); })
      .fail((xhr) => {
        let err = `${xhr.statusText} ${xhr.status}`;
        try {
          let response = JSON.parse(xhr.responseText);
          err += `\n${response.error.status} (${response.error.message})`
        } catch { }
        console.log(err);
        alert(err);
      });
  }
  /**
   * Gets a shallow copy of the full list of rows.
   * 
   * If rows have not yet been loaded, this will load them.
   * 
   * @returns A promise containing the list of rows when resolved.
   */
  _getAllTickets(force_refresh = false) {
    return new Promise((resolve, reject) => {
      if (this.__all_tickets !== null && !force_refresh) {
        while (this.__all_tickets_lock === true) { }
        resolve(this.__all_tickets);
      }
      else {
        this.getSpreadsheetValues()
          .then(() => resolve(this.__all_tickets))
          .catch(error => reject(error));
      }
    });
  }

  __processStatusTypes(types_raw_data) {
    this.__status_types = {};
    for (let r = 0; r < types_raw_data.values.length; r++) {
      let row = types_raw_data.values[r];
      this.__status_types[row[0]] = { 'color': row[1], 'waiting': Boolean(Number(row[2])), 'description': row[3] }
    }
    this.getRenderInfoForStatus('Waiting to Print');
  }
  /**
   * Returns the best matching info for the status.
   * 
   * @param {string} ticket_status The ticket's status.
   * @returns The info for that type of status, or null if no match is found.
   */
  getRenderInfoForStatus(ticket_status) {
    let max_length = 0;
    let max_status = undefined;
    for (let status in this.__status_types) {
      if (ticket_status.includes(status)) {
        if (max_length < status.length) {
          // Best match is the longest search term that still matched.
          // e.g., for 'On Hold(Waiting for Payment)', 'On Hold' is a worse match than 'One Hold (Waiting'
          max_length = status.length;
          max_status = status;
        }
      }
    }
    if (max_status === undefined)
      return null;
    return this.__status_types[max_status];
  }
  /**
   * Gets a shallow copy of the requested rows.
   * 
   * @returns The rows.
   */
  getTickets(id_array) {
    if (!Array.isArray(id_array));

    return this.__all_tickets.filter(tic => { return !id_array.includes(tic.uuid) });
  }

  /**
   * Get a list of rows by IDs.
   * 
   * @param {Array} search_list An array of string IDs to search.
   * @param {boolean} sort Whether to sort across printer types by 'waiting' status.
   *                       This makes different printer types more digestible 
   *                       in one list; this way, tickets from one type aren't 
   *                       all placed below another. Priority sorting will be preserved.
   * @returns An ordered array of IDs matching the rows in __all_tickets.
   */
  async findTickets(search_list, sort = true) {
    if (!Array.isArray(search_list)) search_list = [search_list];

    return new Promise((resolve, reject) => {
      this._getAllTickets().then((all_tickets) => {
        let unfound_tickets = search_list;
        let resulting_ids = [];

        for (let i = 0; i < all_tickets.length; i++) {
          let idx = unfound_tickets.findIndex((el) => { return (el === all_tickets[i]['uuid']) })
          if (idx >= 0) {
            resulting_ids.push(i);
            unfound_tickets.splice(idx, 1);
          }
        }

        if (sort) {
          resulting_ids.sort((a, b) => {
            if (all_tickets[a].is_waiting !== all_tickets[b].is_waiting)
              return all_tickets[a].is_waiting ? -1 : 1;
            return 0;
          })
        }

        resolve({ 'found': resulting_ids, 'not_found': unfound_tickets });
      }).catch((error) => reject(error));
    });
  }
}

const ticket_manager = new TicketList();
