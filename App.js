import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, FlatList, ActivityIndicator, Alert, Image, TouchableOpacity, 
  SafeAreaView, ScrollView} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';

export default function App() {
  const [name, setName] = useState('');
  const [nationalityData, setNationalityData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationErrorMsg, setLocationErrorMsg] = useState(null);

  const API_URL = 'https://api.nationalize.io/';
  const FLAG_URL = 'https://flagcdn.com/w320/';

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationErrorMsg('Permissão para acessar a localização foi negada.');
        Alert.alert('Permissão de Localização', 'Para salvar sua localização com as pesquisas, por favor, permita o acesso à localização nas configurações do seu aparelho.');
        return;
      }

      try {
        let location = await Location.getCurrentPositionAsync({});
        setCurrentLocation(location.coords);
      } catch (error) {
        console.error('Erro ao obter localização:', error);
        setLocationErrorMsg('Não foi possível obter a localização atual.');
      }
    })();
    loadSearchHistory();
  }, []);

  const fetchNationality = async (searchName) => {
    const nameToSearch = searchName || name;
    if (!nameToSearch.trim()) {
      Alert.alert('Atenção', 'Por favor, digite um nome para buscar.');
      return;
    }

    setLoading(true);
    setNationalityData(null);

    try {
      const encodedName = encodeURIComponent(nameToSearch);
      const response = await fetch(`${API_URL}?name=${encodedName}`);

      if (!response.ok) {
        let errorBody = 'Corpo da resposta de erro vazio ou ilegível.';
        try {
          const errorJson = await response.json();
          errorBody = JSON.stringify(errorJson, null, 2);
        } catch (jsonError) {
          errorBody = await response.text();
        }
        throw new Error(`Erro na API: ${response.status} ${response.statusText}. Detalhes: ${errorBody}`);
      }

      const data = await response.json();

      if (data.country && data.country.length > 0) {
        const dataToSave = {
          ...data,
          timestamp: new Date().toISOString(),
          location: currentLocation ? {
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
          } : null,
        };
        setNationalityData(data);
        saveSearchHistory(dataToSave);
      } else {
        Alert.alert('Resultado', `Nenhuma nacionalidade encontrada para "${nameToSearch}".`);
        setNationalityData(null);
      }
    } catch (error) {
      console.error('Erro ao buscar nacionalidade:', error);
      Alert.alert('Erro', `Não foi possível buscar a nacionalidade. ${error.message || 'Verifique sua conexão.'}`);
    } finally {
      setLoading(false);
    }
  };

  const saveSearchHistory = async (data) => {
    try {
      const history = await AsyncStorage.getItem('searchHistory');
      let parsedHistory = history ? JSON.parse(history) : [];

      const existingIndex = parsedHistory.findIndex(item => item.name.toLowerCase() === data.name.toLowerCase());
      if (existingIndex > -1) {
        parsedHistory.splice(existingIndex, 1);
      }
      parsedHistory.unshift(data);

      if (parsedHistory.length > 10) {
        parsedHistory = parsedHistory.slice(0, 10);
      }

      await AsyncStorage.setItem('searchHistory', JSON.stringify(parsedHistory));
      setSearchHistory(parsedHistory);
    } catch (error) {
      console.error('Erro ao salvar histórico:', error);
    }
  };

  const loadSearchHistory = async () => {
    try {
      const history = await AsyncStorage.getItem('searchHistory');
      if (history) {
        const loadedHistory = JSON.parse(history);
        setSearchHistory(loadedHistory);
      } else {
        console.log('Nenhum histórico encontrado no armazenamento local.');
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      Alert.alert('Atenção', 'Houve um problema ao carregar o histórico. Ele será limpo.');
      await AsyncStorage.removeItem('searchHistory');
      setSearchHistory([]);
    }
  };

  const handleHistoryItemPress = (item) => {
    setName(item.name);
    setNationalityData(item);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <LinearGradient
          colors={['#4a6d8c', '#6b8da6']}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={styles.title}>
            <Text style={styles.highlight}>🌍 Qual a Origem do Seu Nome?</Text>
          </Text>
        </LinearGradient>

        <ScrollView contentContainerStyle={styles.mainContentScrollView}>
          {locationErrorMsg ? (
            <Text style={styles.locationError}>{locationErrorMsg}</Text>
          ) : currentLocation ? (
            <Text style={styles.currentLocationText}>
              Localização atual: Lat {currentLocation.latitude.toFixed(4)}, Lon {currentLocation.longitude.toFixed(4)}
            </Text>
          ) : (
            <Text style={styles.currentLocationText}>Obtendo localização...</Text>
          )}

          <TextInput
            style={styles.input}
            placeholder="Digite um nome..."
            placeholderTextColor="#7f8c8d"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            onSubmitEditing={() => fetchNationality()}
          />

          <TouchableOpacity
            style={[styles.searchButton, loading && styles.searchButtonDisabled]} 
            onPress={() => fetchNationality()}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.searchButtonText}>Buscar Nacionalidade</Text>
            )}
          </TouchableOpacity>

          {nationalityData && nationalityData.country && nationalityData.country.length > 0 && (
            <View style={styles.resultContainer}>
              <Text style={styles.resultTitle}>Resultados para "{nationalityData.name}":</Text>
              <FlatList
                data={nationalityData.country}
                keyExtractor={(item) => item.country_id}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <View style={styles.countryItem}>
                    <Image
                      source={{ uri: `${FLAG_URL}${item.country_id.toLowerCase()}.png` }}
                      style={styles.flag}
                      accessibilityLabel={`${item.country_id} flag`}
                    />
                    <View>
                      <Text style={styles.countryCode}>{item.country_id}</Text>
                      <Text style={styles.probabilityText}>Probabilidade: {(item.probability * 100).toFixed(2)}%</Text>
                    </View>
                  </View>
                )}
              />
            </View>
          )}

          <Text style={styles.historySectionTitle}>Histórico de Pesquisas</Text>

          {searchHistory.length > 0 ? (
            <FlatList
              data={searchHistory}
              keyExtractor={(item, index) => item.name + String(index) + (item.timestamp || '')}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.historyItem}
                  onPress={() => handleHistoryItemPress(item)}
                >
                  <Text style={styles.historyName}>{item.name}</Text>
                  {item.country && item.country.length > 0 ? (
                    <View style={styles.historyProbabilities}>
                      {item.country.slice(0, 3).map((country, idx) => (
                        <Text key={idx} style={styles.historyProbability}>
                          {country.country_id}: {(country.probability * 100).toFixed(2)}%
                        </Text>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.historyNoResult}>Nenhuma nacionalidade encontrada</Text>
                  )}
                  {item.location && (
                    <Text style={styles.historyLocation}>
                      Pesquisado em: Lat {item.location.latitude.toFixed(4)}, Lon {item.location.longitude.toFixed(4)}
                    </Text>
                  )}
                  {item.timestamp && (
                    <Text style={styles.historyTimestamp}>
                      ({new Date(item.timestamp).toLocaleString()})
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            />
          ) : (
            <Text style={styles.noHistoryText}>Nenhuma pesquisa no histórico.</Text>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  container: {
    flex: 1,
  },
  header: {
    padding: 15,
    paddingTop: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#E0E0E0',
  },
  highlight: {
    color: 'white',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 12,
  },
  mainContentScrollView: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    marginHorizontal: 10,
    marginTop: -10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    flexGrow: 1,
  },
  locationError: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: 'bold',
  },
  currentLocationText: {
    textAlign: 'center',
    marginBottom: 10,
    color: '#555',
    fontSize: 14,
    marginTop: 5
  },
  input: {
    width: '100%',
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    color: '#333',
    marginTop: 20,
  },
  searchButton: {
    backgroundColor: '#3498db', 
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  searchButtonDisabled: {
    backgroundColor: '#a0d4f7',
  },
  searchButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resultContainer: {
    marginTop: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 10,
    backgroundColor: '#f9f9f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2c3e50',
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  flag: {
    width: 40,
    height: 30,
    marginRight: 15,
    borderRadius: 3,
    borderWidth: 0.5,
    borderColor: '#ccc',
  },
  countryCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  probabilityText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  historySectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 30,
    marginBottom: 15,
    color: '#2c3e50',
    textAlign: 'center',
  },
  historyItem: {
    backgroundColor: '#ecf0f1',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  historyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  historyProbabilities: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  historyProbability: {
    fontSize: 13,
    color: '#555',
    marginRight: 10,
  },
  historyNoResult: {
    fontSize: 13,
    color: '#888',
    fontStyle: 'italic',
  },
  noHistoryText: {
    textAlign: 'center',
    color: '#7f8c8d',
    marginTop: 10,
  },
  historyLocation: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  historyTimestamp: {
    fontSize: 10,
    color: '#888',
    marginTop: 2,
    fontStyle: 'italic',
  }
});
