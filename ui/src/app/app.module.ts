import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';

// Apollo stuff
import { HttpClientModule } from '@angular/common/http';
import { Apollo, ApolloModule } from 'apollo-angular';
import { ApolloLink } from 'apollo-link';
import { HttpLink, HttpLinkModule } from 'apollo-angular-link-http';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { HttpHeaders } from '@angular/common/http';
import { WebSocketLink } from 'apollo-link-ws';
import { split } from 'apollo-link';
import { getMainDefinition } from 'apollo-utilities';

// Material stuff
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatTableModule } from '@angular/material';

// Moment
import { MomentModule } from 'ngx-moment';

const endpoint = 'http://localhost:3000/graphql';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    ApolloModule,
    HttpLinkModule,
    BrowserAnimationsModule,
    MatTableModule,
    MomentModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor(
    apollo: Apollo,
    httpLink: HttpLink
  ) {
    const HTTP_LINK = httpLink.create({
      uri: endpoint,
      headers: new HttpHeaders()
        .set('Content-Type', 'application/json')
    });
    const WS_LINK = new WebSocketLink({
      uri: `ws://localhost:3000/subscriptions`,
      options: {
        reconnect: true
      }
    });

    const LINK = split(
      ({ query }) => {
        const definition = getMainDefinition(query);
        return definition.kind === 'OperationDefinition' && definition.operation === 'subscription';
      },
      WS_LINK,
      HTTP_LINK,
    );
    apollo.create({
      link: LINK,
      cache: new InMemoryCache()
    });
  }
}
