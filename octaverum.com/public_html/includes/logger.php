<?php
/**
 * Logger.php - Loglama yardımcı sınıfı
 * 
 * Sistem genelinde log kaydı tutmak için kullanılır.
 */

class Logger {
    // Log seviyeleri
    const DEBUG = 'DEBUG';
    const INFO = 'INFO';
    const WARNING = 'WARNING';
    const ERROR = 'ERROR';
    
    // Log dizini ve dosya adı
    private $logDir;
    private $logFile;
    
    // Aktif log seviyesi
    private $logLevel;
    
    // Log seviyeleri hiyerarşisi (en düşükten en yükseğe)
    private $logLevels = [
        self::DEBUG => 0,
        self::INFO => 1,
        self::WARNING => 2,
        self::ERROR => 3
    ];
    
    /**
     * Constructor
     * 
     * @param string $logDir Log dizini
     * @param string $logFile Log dosyası adı
     * @param string $logLevel Aktif log seviyesi
     */
    public function __construct($logDir = null, $logFile = null, $logLevel = self::INFO) {
        // Varsayılan log dizini
        $this->logDir = $logDir ?: __DIR__ . '/../logs';
        
        // Varsayılan log dosyası
        $this->logFile = $logFile ?: 'app.log';
        
        // Aktif log seviyesi
        $this->logLevel = $logLevel;
        
        // Log dizinini kontrol et ve oluştur
        $this->checkLogDirectory();
    }
    
    /**
     * Log dizinini kontrol et ve gerekirse oluştur
     */
    private function checkLogDirectory() {
        if (!file_exists($this->logDir)) {
            if (!mkdir($this->logDir, 0755, true)) {
                throw new Exception("Log dizini oluşturulamadı: {$this->logDir}");
            }
        }
        
        if (!is_writable($this->logDir)) {
            throw new Exception("Log dizini yazılabilir değil: {$this->logDir}");
        }
    }
    
    /**
     * Log seviyesinin aktif seviyeye göre loglanabilir olup olmadığını kontrol et
     * 
     * @param string $level Kontrol edilecek log seviyesi
     * @return bool Loglanabilir mi?
     */
    private function isLoggable($level) {
        return $this->logLevels[$level] >= $this->logLevels[$this->logLevel];
    }
    
    /**
     * Log mesajını dosyaya yaz
     * 
     * @param string $level Log seviyesi
     * @param string $message Log mesajı
     * @param array $context Ek veri
     * @return bool Başarılı mı?
     */
    private function write($level, $message, array $context = []) {
        if (!$this->isLoggable($level)) {
            return false;
        }
        
        // Tarih ve zaman damgası
        $timestamp = date('Y-m-d H:i:s');
        
        // İstek bilgileri
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        $requestId = uniqid();
        
        // Context bilgilerini JSON'a çevir
        $contextStr = !empty($context) ? ' ' . json_encode($context) : '';
        
        // Log satırını oluştur
        $logLine = "[{$timestamp}] [{$level}] [{$ip}] [{$requestId}] {$message}{$contextStr}" . PHP_EOL;
        
        // Log dosyasına yaz
        $logPath = $this->logDir . '/' . $this->logFile;
        
        return file_put_contents($logPath, $logLine, FILE_APPEND | LOCK_EX) !== false;
    }
    
    /**
     * Debug seviyesinde log yaz
     * 
     * @param string $message Log mesajı
     * @param array $context Ek veri
     * @return bool Başarılı mı?
     */
    public function debug($message, array $context = []) {
        return $this->write(self::DEBUG, $message, $context);
    }
    
    /**
     * Info seviyesinde log yaz
     * 
     * @param string $message Log mesajı
     * @param array $context Ek veri
     * @return bool Başarılı mı?
     */
    public function info($message, array $context = []) {
        return $this->write(self::INFO, $message, $context);
    }
    
    /**
     * Warning seviyesinde log yaz
     * 
     * @param string $message Log mesajı
     * @param array $context Ek veri
     * @return bool Başarılı mı?
     */
    public function warning($message, array $context = []) {
        return $this->write(self::WARNING, $message, $context);
    }
    
    /**
     * Error seviyesinde log yaz
     * 
     * @param string $message Log mesajı
     * @param array $context Ek veri
     * @return bool Başarılı mı?
     */
    public function error($message, array $context = []) {
        return $this->write(self::ERROR, $message, $context);
    }
    
    /**
     * Exception'ı log dosyasına yaz
     * 
     * @param Exception $exception Log yazılacak exception
     * @param array $context Ek veri
     * @return bool Başarılı mı?
     */
    public function exception($exception, array $context = []) {
        $message = get_class($exception) . ': ' . $exception->getMessage() . 
                   ' in ' . $exception->getFile() . ' on line ' . $exception->getLine();
        
        // Stack trace'i context'e ekle
        $context['stackTrace'] = $exception->getTraceAsString();
        
        return $this->error($message, $context);
    }
    
    /**
     * Log seviyesini değiştir
     * 
     * @param string $logLevel Yeni log seviyesi
     * @return void
     */
    public function setLogLevel($logLevel) {
        if (array_key_exists($logLevel, $this->logLevels)) {
            $this->logLevel = $logLevel;
        }
    }
    
    /**
     * Log dosyasını değiştir
     * 
     * @param string $logFile Yeni log dosyası adı
     * @return void
     */
    public function setLogFile($logFile) {
        $this->logFile = $logFile;
    }
    
    /**
     * PHP hatalarını loglama işlevi
     * 
     * @param int $errno Hata numarası
     * @param string $errstr Hata mesajı
     * @param string $errfile Hata dosyası
     * @param int $errline Hata satırı
     * @return bool Hatanın işlendiğini belirt
     */
    public function errorHandler($errno, $errstr, $errfile, $errline) {
        $errorTypes = [
            E_ERROR => 'Error',
            E_WARNING => 'Warning',
            E_PARSE => 'Parse Error',
            E_NOTICE => 'Notice',
            E_CORE_ERROR => 'Core Error',
            E_CORE_WARNING => 'Core Warning',
            E_COMPILE_ERROR => 'Compile Error',
            E_COMPILE_WARNING => 'Compile Warning',
            E_USER_ERROR => 'User Error',
            E_USER_WARNING => 'User Warning',
            E_USER_NOTICE => 'User Notice',
            E_STRICT => 'Strict',
            E_RECOVERABLE_ERROR => 'Recoverable Error',
            E_DEPRECATED => 'Deprecated',
            E_USER_DEPRECATED => 'User Deprecated'
        ];
        
        $type = isset($errorTypes[$errno]) ? $errorTypes[$errno] : 'Unknown Error';
        $message = "{$type}: {$errstr} in {$errfile} on line {$errline}";
        
        switch ($errno) {
            case E_ERROR:
            case E_CORE_ERROR:
            case E_COMPILE_ERROR:
            case E_USER_ERROR:
                $this->error($message);
                break;
                
            case E_WARNING:
            case E_CORE_WARNING:
            case E_COMPILE_WARNING:
            case E_USER_WARNING:
                $this->warning($message);
                break;
                
            case E_NOTICE:
            case E_USER_NOTICE:
            case E_DEPRECATED:
            case E_USER_DEPRECATED:
            case E_STRICT:
                $this->info($message);
                break;
                
            default:
                $this->error($message);
        }
        
        // PHP'nin kendi hata işleyicisine devam etmesini sağla
        return false;
    }
    
    /**
     * Fatal hataları loglama işlevi
     * 
     * @return void
     */
    public function shutdownHandler() {
        $error = error_get_last();
        
        if ($error !== null && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
            $this->error("FATAL ERROR: {$error['message']} in {$error['file']} on line {$error['line']}");
        }
    }
    
    /**
     * PHP hata işleyicilerini ayarla
     * 
     * @return void
     */
    public function registerErrorHandlers() {
        // Normal hataları yakala
        set_error_handler([$this, 'errorHandler']);
        
        // Fatal hataları yakala
        register_shutdown_function([$this, 'shutdownHandler']);
        
        // Exception işleyicisi
        set_exception_handler([$this, 'exception']);
    }
}

// Tek bir logger örneği oluştur
$logger = new Logger();

// error_log() fonksiyonunu override et
function error_log($message, $message_type = 0, $destination = null, $headers = null) {
    global $logger;
    
    if ($message_type === 0) {
        $logger->error($message);
    } else {
        // Standart error_log fonksiyonunu çağır
        return \error_log($message, $message_type, $destination, $headers);
    }
    
    return true;
}
