import { Component, OnInit } from '@angular/core';
import gql from 'graphql-tag';
import { Apollo, QueryRef } from 'apollo-angular';
import { Observable } from 'rxjs/Observable';
import { MatTableDataSource } from '@angular/material';

const FRAGMENT = gql`
  fragment orderParts on Order {
    uuid
    status
    created
    updated
  }
`;

const QUERY = gql`
  query {
    orders {
      ...orderParts
    }
  }
  ${FRAGMENT}
`;

const SUBSCRIPTION_ADDED = gql`
  subscription {
    orderAdded {
      ...orderParts
    }
  }
  ${FRAGMENT}
`;

const SUBSCRIPTION_UPDATED = gql`
  subscription {
    orderUpdated {
      ...orderParts
    }
  }
  ${FRAGMENT}
`;

interface Order {
  uuid: string;
  status: string;
  created: Date;
  updated: Date;
}

interface QueryResult {
  orders: Order[];
}


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  ordersQuery: QueryRef<QueryResult>;
  displayedColumns = ['uuid', 'status', 'created', 'updated'];
  dataSource = new MatTableDataSource();

  constructor(apollo: Apollo) {
    this.ordersQuery = apollo.watchQuery({
      query: QUERY
    });
  }

  ngOnInit() {
    this.ordersQuery.valueChanges.subscribe(data => {
      this.dataSource = new MatTableDataSource(data.data.orders);
    });
    this.subscribeToNewOrders();
    this.subscribeToUpdatedOrders();
  }

  subscribeToNewOrders() {
    this.ordersQuery.subscribeToMore({
      document: SUBSCRIPTION_ADDED,
      updateQuery: (prev: any, {subscriptionData}) => {
        if (!subscriptionData.data || !subscriptionData.data.hasOwnProperty('orderAdded')) {
          return prev;
        }
        const newOrderItem = subscriptionData.data.orderAdded;
        return Object.assign({}, prev, {
          orders: [...prev.orders, newOrderItem]
        });
      }
    });
  }

  subscribeToUpdatedOrders() {
    this.ordersQuery.subscribeToMore({
      document: SUBSCRIPTION_UPDATED,
      updateQuery: (prev: any, {subscriptionData}) => {
        if (!subscriptionData.data || !subscriptionData.data.hasOwnProperty('orderUpdated')) {
          return prev;
        }
        const updatedOrderItem = subscriptionData.data.orderUpdated;
        return Object.assign({}, prev, {
          orders: prev.orders.map(el => {
            return el.uuid === updatedOrderItem.uuid ? updatedOrderItem : el;
          })
        });
      }
    });
  }
}
