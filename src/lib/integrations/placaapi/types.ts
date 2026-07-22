export interface PlacaApiResponse {
  placa: string
  chassi: string
  renavam: string
  marca: string
  modelo: string
  anoFabricacao: number
  anoModelo: number
  cor: string
  combustivel: string
  cilindradas: string
  potencia: string
  cambio: string
  tipoVeiculo: string
  situacao: string
  uf: string
  municipio: string
  cpfCnpjProprietario: string
  nomeProprietario: string
  dataAtualizacao: string
}

export interface PlacaLookupResult {
  success: boolean
  data?: PlacaApiResponse
  error?: string
}
