// ThemeContext.js
import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from 'react';
import {themes} from '@constants/themes';
import {getAsyncStorage, setAsyncStorage} from './AsyncStorage';
import {Appearance, ColorValue} from 'react-native';
import {ColorSchemeName} from 'react-native';

interface ThemeContextProps {
  theme: iCOLORS;
  themeName: keyof iTHEMES;
  switchTheme: (themeName: keyof iTHEMES) => void;
}

const ThemeContext = createContext<ThemeContextProps>({
  theme: themes?.LIGHT,
  themeName: 'LIGHT',
  switchTheme(themeName) {},
});
// const ThemeContext = createContext();

interface iCOLORS {
  BACKGROUND: ColorValue;
  HEADER_BACKGROUND: ColorValue;
  PRIMARY_COLOR: ColorValue;
  BACKGROUND_LIGHT: ColorValue;
  BACKGROUND_2: ColorValue;
  TEXT: ColorValue;
  TEXT_LIGHT: ColorValue;
  TEXT_6: ColorValue;
  BORDER: ColorValue;
}

export interface iTHEMES {
  LIGHT: iCOLORS;
  DARK: iCOLORS;
  SYSTEM?: iCOLORS;
  BLUE: iCOLORS;
}

interface ThemeProviderProps {
  children: ReactNode;
}
export const ThemeProvider: React.FC<ThemeProviderProps> = ({children}) => {
  const [theme, setTheme] = useState<keyof iTHEMES>('LIGHT');
  const [colorScheme, setColorScheme] = useState<ColorSchemeName>(
    Appearance.getColorScheme(),
  );
  useEffect(() => {
    const loadTheme = async () => {
      const savedTheme = await getAsyncStorage('appTheme');
      const isSystem = await getAsyncStorage('systemTheme');
      if (isSystem == 'true') {
        systemThemeHandle();
      } else if (savedTheme) {
        setTheme(savedTheme as keyof iTHEMES);
      } else {
        return;
      }
    };
    loadTheme();
  }, []);
  useEffect(() => {
    const listener = Appearance.addChangeListener(({colorScheme}) => {
      getAsyncStorage('systemTheme')
        .then(isSystem => {
          if (isSystem == 'true') {
            systemThemeHandle();
          } else {
            return;
          }
        })
        .catch(e => {
          console.log('error', e);
        });
    });
    return () => listener.remove();
  }, [colorScheme]);

  const systemThemeHandle = () => {
    const color = Appearance.getColorScheme();
    if (color == 'light') {
      setTheme('LIGHT');
      setAsyncStorage('appTheme', 'LIGHT');
    } else {
      setTheme('DARK');
      setAsyncStorage('appTheme', 'DARK');
    }
  };

  const switchTheme = (themeName: keyof iTHEMES) => {
    const newTheme = themeName || themes?.DARK;
    setTheme(newTheme);
    if (themeName == 'SYSTEM') {
      setAsyncStorage('systemTheme', 'true');
      systemThemeHandle();
    } else {
      setAsyncStorage('appTheme', themeName);

      setAsyncStorage('systemTheme', 'false');
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        theme: themes[theme as keyof iTHEMES] || themes['DARK'],
        themeName: theme,
        switchTheme,
      }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
