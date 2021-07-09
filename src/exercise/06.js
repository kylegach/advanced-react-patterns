// Control Props
// http://localhost:3000/isolated/exercise/06.js

import * as React from 'react'
import warning from 'warning'
import {Switch} from '../switch'

const callAll =
  (...fns) =>
  (...args) =>
    fns.forEach(fn => fn?.(...args))

const actionTypes = {
  toggle: 'toggle',
  reset: 'reset',
}

function toggleReducer(state, {type, initialState}) {
  switch (type) {
    case actionTypes.toggle: {
      return {on: !state.on}
    }
    case actionTypes.reset: {
      return initialState
    }
    default: {
      throw new Error(`Unsupported type: ${type}`)
    }
  }
}

function useControlledSwitchWarning({
  componentName,
  controlledPropName,
  isControlled,
}) {
  if (process.env.NODE_ENV !== 'production') {
    // [1] `process.env.NODE_ENV` will never change in a running app, so this hook call is _not_ actually conditional
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const {current: wasControlled} = React.useRef(isControlled)

    // [1]
    // eslint-disable-next-line react-hooks/rules-of-hooks
    React.useEffect(() => {
      warning(
        !(isControlled && !wasControlled),
        `\`${componentName}\` is changing from uncontrolled to controlled. Components should not switch from uncontrolled to controlled (or vice versa). Decide between using a controlled or uncontrolled \`${componentName}\` for the lifetime of the component. Check the \`${controlledPropName}\` prop.`,
      )
      warning(
        !(!isControlled && wasControlled),
        `\`${componentName}\` is changing from controlled to uncontrolled. Components should not switch from uncontrolled to controlled (or vice versa). Decide between using a controlled or uncontrolled \`${componentName}\` for the lifetime of the component. Check the \`${controlledPropName}\` prop.`,
      )
    }, [componentName, controlledPropName, isControlled, wasControlled])
  }
}

function useOnChangeReadOnlyWarning({
  componentName,
  controlledPropName,
  isControlled,
  onChange,
  onChangePropName = 'onChange',
  readOnly,
  readOnlyPropName = 'readOnly',
  uncontrolledPropName,
}) {
  if (process.env.NODE_ENV !== 'production') {
    // [1]
    // eslint-disable-next-line react-hooks/rules-of-hooks
    React.useEffect(() => {
      warning(
        !(isControlled && !onChange && !readOnly),
        `Failed prop type: You provided a \`${controlledPropName}\` prop to ${componentName} without an \`${onChangePropName}\` handler. This will render a read-only component. If the component should be mutable use \`${uncontrolledPropName}\`. Otherwise, set \`${onChangePropName}\` or \`${readOnlyPropName}\`.`,
      )
    }, [
      componentName,
      controlledPropName,
      isControlled,
      onChange,
      onChangePropName,
      readOnly,
      readOnlyPropName,
      uncontrolledPropName,
    ])
  }
}

function useToggle({
  initialOn = false,
  reducer = toggleReducer,
  onChange,
  on: controlledOn,
  readOnly,
} = {}) {
  const {current: initialState} = React.useRef({on: initialOn})
  const [state, dispatch] = React.useReducer(reducer, initialState)

  const onIsControlled = controlledOn != null

  useOnChangeReadOnlyWarning({
    componentName: 'useToggle',
    controlledPropName: 'on',
    isControlled: onIsControlled,
    onChange,
    readOnly,
    uncontrolledPropName: 'initialOn',
  })

  useControlledSwitchWarning({
    componentName: 'useToggle',
    controlledPropName: 'on',
    isControlled: onIsControlled,
  })

  const on = onIsControlled ? controlledOn : state.on

  function dispatchWithOnChange(action) {
    if (!onIsControlled) {
      dispatch(action)
    }
    const newState = reducer({...state, on}, action)
    onChange?.(newState, action)
  }

  const toggle = () => dispatchWithOnChange({type: actionTypes.toggle})
  const reset = () =>
    dispatchWithOnChange({type: actionTypes.reset, initialState})

  function getTogglerProps({onClick, ...props} = {}) {
    return {
      'aria-pressed': on,
      onClick: callAll(onClick, toggle),
      ...props,
    }
  }

  function getResetterProps({onClick, ...props} = {}) {
    return {
      onClick: callAll(onClick, reset),
      ...props,
    }
  }

  return {
    on,
    reset,
    toggle,
    getTogglerProps,
    getResetterProps,
  }
}

function Toggle({on: controlledOn, onChange, readOnly}) {
  const {on, getTogglerProps} = useToggle({
    on: controlledOn,
    onChange,
    readOnly,
  })
  const props = getTogglerProps({on})
  return <Switch {...props} />
}

function App() {
  const [bothOn, setBothOn] = React.useState(false)
  const [timesClicked, setTimesClicked] = React.useState(0)

  function handleToggleChange(state, action) {
    if (action.type === actionTypes.toggle && timesClicked > 4) {
      return
    }
    setBothOn()
    setTimesClicked(c => c + 1)
  }

  function handleResetClick() {
    setBothOn(false)
    setTimesClicked(0)
  }

  return (
    <div>
      <div>
        <Toggle on={bothOn} onChange={handleToggleChange} />
        <Toggle on={bothOn} onChange={handleToggleChange} />
      </div>
      {timesClicked > 4 ? (
        <div data-testid="notice">
          Whoa, you clicked too much!
          <br />
        </div>
      ) : (
        <div data-testid="click-count">Click count: {timesClicked}</div>
      )}
      <button onClick={handleResetClick}>Reset</button>
      <hr />
      <div>
        <div>Uncontrolled Toggle:</div>
        <Toggle
          onChange={(...args) =>
            console.info('Uncontrolled Toggle onChange', ...args)
          }
        />
      </div>
    </div>
  )
}

export default App
// we're adding the Toggle export for tests
export {Toggle}

/*
eslint
  no-unused-vars: "off",
*/
