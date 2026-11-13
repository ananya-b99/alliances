package com.alliances;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;
+
@SpringBootApplication
@EnableScheduling
public class AlliancesApplication {
    public static void main(String[] args) {
        SpringApplication.run(AlliancesApplication.class, args);
    }
}
