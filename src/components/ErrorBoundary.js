import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.errorText}>{this.state.error?.toString()}</Text>
          <TouchableOpacity 
            style={styles.button} 
            onPress={() => this.setState({ hasError: false })}
          >
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F1A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    color: '#FF6584',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 10,
  },
  errorText: {
    color: '#B0B0D0',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#6C63FF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '800',
  },
});

export default ErrorBoundary;
