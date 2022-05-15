import React, { Component } from "react";
import { hot } from "react-hot-loader";
import PageHeader from "./page-header.jsx";
import TicketIdInput from "./ticket-id-input.jsx";
import TicketUrlGenerator from "./ticket-url-generator.jsx";
import TicketsTable from "./ticket-table/ticket-table.jsx";

class TicketsForm extends Component {
  render() {
    return ( //
      <React.Fragment>
        <PageHeader />
        <TicketIdInput />
        <TicketUrlGenerator />
        <TicketsTable />
      </React.Fragment>);
  }
}

export default hot(module)(TicketsForm);
