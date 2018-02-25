package org.docdriven.wiki.controller;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.nio.file.Files;

import javax.servlet.http.HttpServletRequest;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class DocController {

	private static final String README_MD_FILE = "README";
	private static final String MD_EXTENSION = ".md";

	@PostMapping("/document")
	public void postDocument(@RequestBody String content) throws IOException {
		this.writeToFile(README_MD_FILE, content);
	}

	@PostMapping("/document/**")
	public void postDocument(HttpServletRequest request, @RequestBody String content) throws IOException {
		this.writeToFile(extractPath(request.getRequestURI()), content);
	}

	private String extractPath(String requestURI) {
		return requestURI.substring("document/".length());
	}

	@GetMapping("/document")
	public String getDocument() throws IOException {
		return readFromFile(README_MD_FILE);
	}

	@GetMapping("/document/**")
	public String getDocument(HttpServletRequest request) throws IOException {
		return readFromFile(extractPath(request.getRequestURI()));
	}

	protected void writeToFile(String filePath, String content) throws IOException {
		File mdFile = toMdFile(filePath);
		File mdFileParent = mdFile.getParentFile();
		if (!mdFileParent.exists()) {
			mdFileParent.mkdirs();
		}
		FileWriter readMeWriter = new FileWriter(mdFile, false);
		readMeWriter.write(content);
		readMeWriter.close();
	}

	protected File toMdFile(String filePath) {
		if (!filePath.startsWith(".")) {
			if (!filePath.startsWith("/")) {
				filePath = "/" + filePath;
			}
			filePath = "." + filePath;
		}

		File mdFile = new File(filePath + MD_EXTENSION);
		return mdFile;
	}

	protected String readFromFile(String filePath) throws IOException {
		File mdFile = toMdFile(filePath);
		if (mdFile.exists()) {
			return new String(Files.readAllBytes(mdFile.toPath()));
		} else {

			String[] filePathSegments = filePath.split("/");
			String filename = filePathSegments[filePathSegments.length - 1];

			StringBuffer contentBuffer = new StringBuffer();
			contentBuffer.append("---").append(System.lineSeparator());
			contentBuffer.append("title: ").append(filename).append(System.lineSeparator());
			contentBuffer.append("summary: ").append("empty").append(System.lineSeparator());
			contentBuffer.append(System.lineSeparator());
			contentBuffer.append("---").append(System.lineSeparator());
			contentBuffer.append("[//]: # (block)").append(System.lineSeparator());
			contentBuffer.append("empty").append(System.lineSeparator());

			return contentBuffer.toString();
		}

	}

}
