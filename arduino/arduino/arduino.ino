// ---------------------------------------------------------------- //
// Arduino Ultrasoninc Sensor HC-SR04
// Re-writed by Arbi Abdul Jabbaar
// Using Arduino IDE 1.8.7
// Using HC-SR04 Module
// Tested on 17 September 2019
// ---------------------------------------------------------------- //

int tp1 = 3;
int ep1 = 4;

int tp2 = 5;
int ep2 = 6;

int tp3 = 7;
int ep3 = 8;


long duration1; 
long distance1; 

long duration2; 
long distance2;

long duration3; 
long distance3;

long cycle;
long last_cycle = 0;

long pause = 10;
int state = 0;

bool connection = false;

String serial = "";

void setup() {
  pinMode(tp1, OUTPUT); 
  pinMode(ep1, INPUT);

  pinMode(tp2, OUTPUT); 
  pinMode(ep2, INPUT);

  pinMode(tp3, OUTPUT); 
  pinMode(ep3, INPUT);
  
  Serial.begin(9600);

}


void connection_setup(String input) {

  //if ( input != "" ) { Serial.println(input); }
  
  if ( input == "ready?" ) {
    
    Serial.println("system:connected");
    connection = true;
    
  }
  
}

void loop() {

  cycle = micros();
  
  //if ( cycle < last_cycle ) {


   if ( Serial.available() > 0 ) {
    
      while ( Serial.available() > 0 ) {
        
        char SChar = Serial.read();
        //Serial.println( SChar );

         //char SChar = false;
         //Serial.println( Serial.read() );

        if ( SChar == 10 ) {
          
          connection_setup(serial);
          SChar = false;
          serial = ""; 
          
        }

        else if ( SChar != 13 ) {
          
          serial = serial + String( SChar );
          
        }
        
      }
      
    
   
  }


  if ( connection ) {

    if ( cycle - last_cycle <= 0 ) {
  
      Serial.println("rollover");
      last_cycle = 0;
      
    }
  
  
    //Serial.println(last_cycle + pause <= cycle);  
    //if ( true ) {
    if ( cycle - last_cycle >= pause ) {
  
      
      //Serial.print("state: ");
      //Serial.println(state);   
     
      if ( state == 0 ) {
  
        //Serial.println("start of cycle");
              
        digitalWrite(tp1, LOW); 
        digitalWrite(tp1, HIGH);
        delayMicroseconds(40);
  
        digitalWrite(tp1, LOW);
        delayMicroseconds(40);
        duration1 = pulseIn(ep1, HIGH, 60000);  
        distance1 = duration1 * 0.0343 / 2;
  
        digitalWrite(tp2, LOW);
        digitalWrite(tp2, HIGH);
        delayMicroseconds(40);
  
        digitalWrite(tp2, LOW);
        delayMicroseconds(40);
  
        duration2 = pulseIn(ep2, HIGH, 60000);
        distance2 = duration2 * 0.0343 / 2;

        digitalWrite(tp3, LOW);
        digitalWrite(tp3, HIGH);
        delayMicroseconds(40);
  
        digitalWrite(tp3, LOW);
  
        duration3 = pulseIn(ep3, HIGH, 60000);
        distance3 = duration3 * 0.0343 / 2;
        
  
  
        Serial.print("value:");
        
        Serial.print(distance1);
        
        Serial.print(":");
        
        Serial.print(distance2);

        Serial.print(":");
        
        Serial.println(distance3);
        
  
        state = 0;
        pause = 10000;  
        //Serial.println("end of cycle");
  
      }
      
      last_cycle = cycle;
     }
  }

   else {

    
  
    
   }
   
  
 }
