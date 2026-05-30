package com.ftn.laslouri.criticomrade;

import com.ftn.laslouri.criticomrade.config.DotEnvLoader;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@ConfigurationPropertiesScan
@EnableScheduling
public class CritiComradeApplication {

	public static void main(String[] args) {
		DotEnvLoader.load();
		SpringApplication.run(CritiComradeApplication.class, args);
	}

}
