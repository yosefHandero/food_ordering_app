import { BurgerLogoProps } from '@/type';
import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';

export const BurgerLogo: React.FC<BurgerLogoProps> = ({ 
  size = 56, 
  color = '#E63946' 
}) => {
  const bunHeight = size * 0.16;
  const pattyHeight = size * 0.22;
  const pattyWidth = size * 0.72;
  const cheeseWidth = size * 0.76;
  const lettuceWidth = size * 0.82;
  const spacing = Math.max(1, size * 0.015);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Top Bun */}
      <View 
        style={[
          styles.bun, 
          { 
            width: size * 0.88, 
            height: bunHeight,
            backgroundColor: '#F5D5A0',
            borderTopLeftRadius: size * 0.22,
            borderTopRightRadius: size * 0.22,
            borderBottomLeftRadius: size * 0.06,
            borderBottomRightRadius: size * 0.06,
            ...Platform.select({
              ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
              },
              android: {
                elevation: 1,
              },
            }),
          }
        ]} 
      />
      
      {/* Lettuce */}
      <View 
        style={[
          styles.layer,
          { 
            width: lettuceWidth, 
            height: size * 0.09,
            backgroundColor: '#7CB342',
            borderRadius: size * 0.12,
            marginTop: spacing,
          }
        ]} 
      />
      
      {/* Cheese */}
      <View 
        style={[
          styles.layer,
          { 
            width: cheeseWidth, 
            height: size * 0.07,
            backgroundColor: '#FFC107',
            borderRadius: size * 0.04,
            marginTop: spacing,
          }
        ]} 
      />
      
      {/* Patty */}
      <View 
        style={[
          styles.patty,
          { 
            width: pattyWidth, 
            height: pattyHeight,
            backgroundColor: color,
            borderRadius: size * 0.12,
            marginTop: spacing * 1.5,
            ...Platform.select({
              ios: {
                shadowColor: color,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 3,
              },
              android: {
                elevation: 2,
              },
            }),
          }
        ]} 
      />
      
      {/* Bottom Bun */}
      <View 
        style={[
          styles.bun, 
          { 
            width: size * 0.88, 
            height: bunHeight,
            backgroundColor: '#F5D5A0',
            borderTopLeftRadius: size * 0.06,
            borderTopRightRadius: size * 0.06,
            borderBottomLeftRadius: size * 0.22,
            borderBottomRightRadius: size * 0.22,
            marginTop: spacing * 1.5,
            ...Platform.select({
              ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
              },
              android: {
                elevation: 1,
              },
            }),
          }
        ]} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bun: {
    alignSelf: 'center',
  },
  layer: {
    alignSelf: 'center',
  },
  patty: {
    alignSelf: 'center',
  },
});

