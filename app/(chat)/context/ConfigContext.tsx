// context/ConfigContext.tsx
import React, { createContext, useContext } from 'react';
import { Config } from 'wagmi';

interface ConfigContextType {
  config: Config;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider: React.FC<{
  config: Config;
  children: React.ReactNode;
}> = ({ config, children }) => {
  return (
    <ConfigContext.Provider value={{ config }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = (): ConfigContextType => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};
