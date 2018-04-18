import { Component } from '@angular/core';
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

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'app';
  ordersQuery: QueryRef<any>;
  data: Observable<any>;
  constructor(apollo: Apollo) {
    this.ordersQuery = apollo.watchQuery({
      query: QUERY
    });

    this.data = this.ordersQuery.valueChanges;
  }
}
