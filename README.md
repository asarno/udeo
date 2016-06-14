# udeo (alpha)
Udeo is a [RxJS 5](http://github.com/ReactiveX/RxJS) based state stream container. It is comparable to Redux, where the store is instead modelled as a collection of state streams (one per module). Unidirectional data flow in Udeo is obtained with RxJS (instead of the event emitter approach of past and present Flux implementations), where each module composes its own data flow.

The reasoning behind using RxJS for unidirectional data flow is given here: https://medium.com/@markusctz/state-streams-and-react-7921e3c376a4

A state stream is effectively the result of reducing a stream of actions. It boils down to the simple flow:

Action Stream -> Reduce -> State Stream

## Install

NOTE: This has a peer dependencies of `rxjs@5.0.*`

```sh
npm install --save udeo
```

## Usage
Please read the introduction on Medium: https://medium.com/@markusctz/state-streams-and-react-7921e3c376a4

### `createStore(moduleDefinitions, [preloadedState])` [&#x24C8;](https://github.com/mcoetzee/udeo/blob/master/src/createStore.js "View in source")
Creates a store which houses a collection of state streams. It adds a state stream for each module definition provided.

#### Arguments
1. `moduleDefinitions` *(`Object`)*: Each module definition provides two functions used to form the module's state stream.
2. `[preloadedState]` *(`Object`)*: The initial state. Can be used to hydrate the store from state generated by the server in universal apps.

#### Returns
*(`Object`)*: An Udeo store that allows you to subscribe to the state streams, dispatch actions and read the current state of the application.

### Ajax Example
```js
import { createStore } from 'udeo';

/**
 * @typedef moduleDefinition
 * @type {Object}
 * @property {Function} flow - Provides the module's data flow.
 * Receives the raw action stream as argument and returns an array of action streams to be reduced.
 * @property {Function} reducer - The reducer of the provided flow.
 * Returns the next version of the module's state (a plain old reducer function).
 */
const searchModule = {
  // dispatch$ is the stream through which dispatched actions flow - the raw action stream
  flow(dispatch$) {
    // Filter the raw action stream into a search stream
    const search$ = dispatch$.filterAction('SEARCH');

    // Transform the search stream into a search response stream
    const searchResponse$ = search$
      // Grab the query from the payload
      .pluckPayload()
      // Go to the server with the query (integrates with promises)   
      .flatAjax(ProductService.search)
      // Map the server response to the response action
      .mapAction('SEARCH_RESPONSE');

    // The action streams to reduce state with
    return [
      search$,
      searchResponse$,
    ];
  },
  // Plain old reducer function - reduces state for provided data flow
  reducer(state = { searching: false, results: [] }, action) {
    switch (action.type) {
    case 'SEARCH':
      return {
        ...state,
        searching: true,
      };
    case 'SEARCH_RESPONSE':
      return {
        ...state,
        searching: false,
        results: action.payload,
      };
    default:
      return state;
    } 
  }
};

const someOtherModule = { ... };

// Creates the Udeo store which houses a collection of state streams
// Exposes an API: { dispatch, getState$, getState, setMiddleware, ... }
const store = createStore({ searchModule, someOtherModule });

// Manually subscribe to a particular modules state stream. A view binding library like 
// React-Udeo would usually be used instead of manually subscribing
store.getState$('searchModule').subscribe(state => {
  console.log('Search state: ', state);
});
// >_ Search state: { searching: false, results: [] }

// Dispatches the action into the raw action stream
store.dispatch({ type: 'SEARCH', payload: 'Foo bar' });
// >_ Search state: { searching: true, results: [] }
// Searching...
// >_ Search state: { searching: false, results: [20] }
```
## React Bindings
https://github.com/mcoetzee/react-udeo
