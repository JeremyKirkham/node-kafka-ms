import { Component, OnInit } from '@angular/core';
import gql from 'graphql-tag';
import { Apollo, QueryRef } from 'apollo-angular';
import { Observable } from 'rxjs/Observable';

const QUERY = gql`
  query {
    orders {
      uuid
      status
    }
  }
`;

const SUBSCRIPTION_ADDED = gql`
    subscription {
      orderAdded {
        uuid
        status
      }
    }
`;

const SUBSCRIPTION_UPDATED = gql`
    subscription {
      orderUpdated {
        uuid
        status
      }
    }
`;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  ordersQuery: QueryRef<any>;
  data: Observable<any>;
  constructor(apollo: Apollo) {
    this.ordersQuery = apollo.watchQuery({
      query: QUERY
    });

    this.data = this.ordersQuery.valueChanges;
  }

  ngOnInit() {
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
