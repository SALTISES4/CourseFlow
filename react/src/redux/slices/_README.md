note that the useSlice pattern auto constructs (and registers) the action type like this

[NAMESPACE]/[REDUCER]
i.e. [SliceNamespace.SIDEBAR]/collapse

Mutability
consult the toolkit docs for more explanation but toolkit uses immer under the hood
therefor feel free to write mutable state syntax in the reducer functions
```
  initialState,
  reducers: {
    collapse(state) {
      state.tab = null
      state.collapsed = true
    },
```
```
    insertBelow(state, action: PayloadAction<{ newModel: TColumn }>) {
      state.push(action.payload.newModel)
    },
```
```
    changeField(state, action: PayloadAction<{ json: any }>) {
      Object.assign(state, action.payload.json)
    }
```
No need to return default state

before
```
    builder
      .addCase(
        CommonActions.REPLACE_STOREDATA,
        (state, action: PayloadAction<ReplaceStoreDataPayload>) => {
          return action.payload.week || state
        }
      )
```
After
```
    builder
      .addCase(
        CommonActions.REPLACE_STOREDATA,
        (state, action: PayloadAction<ReplaceStoreDataPayload>) => {
        if(action.payload.week){
          return action.payload.week
          }
        }
      )
```
