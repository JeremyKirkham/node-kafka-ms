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
  title = 'app';
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
  }

  subscribeToNewOrders() {
    this.ordersQuery.subscribeToMore({
      document: SUBSCRIPTION_ADDED,
      updateQuery: (prev: any, {subscriptionData}) => {
        if (!subscriptionData.data) {
          return prev;
        }

        const newOrderItem = subscriptionData.data.orderAdded;

        return Object.assign({}, prev, {
          orders: [newOrderItem, ...prev.orders]
        });
      }
    });
  }
}
