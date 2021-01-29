import {Component, createRef} from "react";
import * as reactDom from "react-dom";
import * as Redux from "redux";
import * as React from "react";
import {Provider, connect} from 'react-redux';
import {configureStore, createStore} from '@reduxjs/toolkit';
import OutcomeTopView from './OutcomeTopView.js'
import * as Reducers from "./Reducers.js";


const rootReducer = Redux.combineReducers({
    outcome:Reducers.outcomeReducer,
    outcomeoutcome:Reducers.outcomeOutcomeReducer,
});

var store;

export function renderOutcomeView(container){
    store = createStore(rootReducer,initial_data);
    reactDom.render(
        <Provider store = {store}>
            <OutcomeTopView objectID={initial_data.outcome[0].id} selection_manager={selection_manager}/>
        </Provider>,
        container
    );
}