import { getAccessorType } from 'typed-vuex'
import * as birthday from '~/store/birthday'
import * as circles from '~/store/circles'
import * as view from '~/store/view'

export const accessorType = getAccessorType({
  modules: {
    birthday,
    circles,
    view,
  },
})
