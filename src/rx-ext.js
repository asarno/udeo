import { Observable, Subject } from 'rxjs';

function isFSA(data) {
  return data && (data.type || data.error);
}

function fromPromise(apiOperation, cancel$) {
  return data => {
    let ajax$ = Observable.fromPromise(apiOperation(data));
    if (cancel$) {
      ajax$ = ajax$.takeUntil(cancel$);
    }
    return ajax$.catch(err => Observable.of({ error: true, payload: err }));
  };
}

Observable.prototype.filterAction = function(type) {
  return this.filter(pl => pl.type === type).share();
};

Observable.prototype.mapAction = function(type) {
  return this.map(
    payload => {
      if (isFSA(payload)) {
        return { ...payload, type };
      }
      return { type, payload };
    })
    .share();
};

Observable.prototype.pluckPayload = function(...keys) {
  return this.pluck('payload', ...keys);
};

Observable.prototype.flatAjax = function(apiOperation, cancel$) {
  return this.flatMap(fromPromise(apiOperation, cancel$));
};

Observable.prototype.switchAjax = function(apiOperation, cancel$) {
  return this.switchMap(fromPromise(apiOperation, cancel$));
};

export {
  Subject,
  Observable
};
