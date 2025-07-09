import {iTHEMES} from '@utills/ThemeContext';
interface listProp {
  id: number;
  name: string;
  value: keyof iTHEMES;
}
export const themeList: Array<listProp> = [
  // {
  //   id: 1,
  //   name: 'systemTheme',
  //   value: 'SYSTEM',
  // },
  {
    id: 2,
    name: 'lightTheme',
    value: 'LIGHT',
  },
  {
    id: 3,
    name: 'darkTheme',
    value: 'DARK',
  },
  // {
  //   id: 4,
  //   name: 'blueTheme',
  //   value: 'BLUE',
  // },
];
export const themes: iTHEMES = {
  LIGHT: {
    BACKGROUND: '#FFFFFF',
    HEADER_BACKGROUND: '#FAFAFA',
    PRIMARY_COLOR: '#6F2ECF',
    BACKGROUND_LIGHT: '#00000010',
    BACKGROUND_2: '#00000020', //use at setting logout view
    TEXT: '#000000',
    TEXT_LIGHT: 'rgba(0,0,0,.4)',
    TEXT_6: 'rgba(0,0,0,.6)', //use at setting icon
    BORDER: 'rgba(0,0,0,.4)',
  },
  DARK: {
    BACKGROUND: '#000000',
    HEADER_BACKGROUND: '#212121',
    PRIMARY_COLOR: '#6F2ECF',
    BACKGROUND_LIGHT: '#ffffff10',
    BACKGROUND_2: '#ffffff20',
    TEXT: '#FFFFFF',
    TEXT_LIGHT: 'rgba(255,255,255,.4)',
    TEXT_6: 'rgba(255,255,255,.6)',
    BORDER: 'rgba(255,255,255,.4)',
  },
  BLUE: {
    BACKGROUND: '#a39bd1',
    HEADER_BACKGROUND: '#a39bd1',
    PRIMARY_COLOR: '#6F2ECF',
    BACKGROUND_LIGHT: '#a39bd110',
    BACKGROUND_2: '#a39bd120',
    TEXT: '#0c014a',
    TEXT_LIGHT: 'rgba(0,0,0,.4)',
    TEXT_6: 'rgba(0,0,0,.6)',
    BORDER: 'rgba(0,0,0,.4)',
  },

  //   blue: {
  //     background: '#a39bd1',
  //     text: '#0c014a',
  //     textLight: 'rgba(0,0,0,.4)',
  //     primary: '#00BCD4',
  //   },
  //   green: {
  //     background: '#E8F5E9',
  //     text: '#388E3C',
  //     textLight: 'rgba(0,0,0,.4)',
  //     primary: '#4CAF50',
  //   },
  //   red: {
  //     background: '#FFEBEE',
  //     text: '#B71C1C',
  //     textLight: 'rgba(0,0,0,.4)',
  //     primary: '#F44336',
  //   },
};
