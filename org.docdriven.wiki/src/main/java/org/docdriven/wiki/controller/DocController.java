package org.docdriven.wiki.controller;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.nio.file.Files;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class DocController {

	private static final String README_MD_FILE = "README.md";
	private String content = "# Content";

	@PostMapping("/document")
	public void postDocument(@RequestBody String content) throws IOException {
		this.content = content;
		this.writeToFile(content);
	}

	@GetMapping("/document")
	public String getDocument() throws IOException {
		return readFromFile();
	}

	protected void writeToFile(String content) throws IOException {
		File readMe = new File(README_MD_FILE);
		FileWriter readMeWriter = new FileWriter(readMe, false);
		readMeWriter.write(content);
		readMeWriter.close();
	}

	protected String readFromFile() throws IOException {
		File readMe = new File(README_MD_FILE);
		if (readMe.exists()) {
			return new String(Files.readAllBytes(readMe.toPath()));
		}
		return this.content;
	}

}
