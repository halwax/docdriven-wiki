package org.docdriven.wiki.doc;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.nio.file.Files;
import java.text.MessageFormat;
import java.util.Optional;

import javax.servlet.http.HttpServletRequest;

import org.docdriven.wiki.project.Project;
import org.docdriven.wiki.project.ProjectService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class DocController {

	private static final String README_MD_FILE = "README";
	private static final String MD_EXTENSION = ".md";

	@Autowired
	private ProjectService projectService;

	@PostMapping("/api/docs/projects/{project}")
	public void postDocument(@PathVariable String project, @RequestBody String content) throws IOException {
		this.writeToFile(project, README_MD_FILE, content);
	}

	@PostMapping("/api/docs/projects/{project}/**")
	public void postDocument(@PathVariable String project, HttpServletRequest request, @RequestBody String content)
			throws IOException {
		this.writeToFile(project, extractPath(project, request.getRequestURI()), content);
	}

	private String extractPath(String project, String requestURI) {
		return requestURI.substring(("api/docs/projects/" + project + "/").length());
	}

	@GetMapping("/api/docs/projects/{project}")
	public String getDocument(@PathVariable String project) throws IOException {
		return readFromFile(project, README_MD_FILE);
	}

	@GetMapping("/api/docs/projects/{project}/**")
	public String getDocument(@PathVariable String project, HttpServletRequest request) throws IOException {
		return readFromFile(project, extractPath(project, request.getRequestURI()));
	}

	protected File getProjectRootFolder(String project) {
		if ("wiki".equals(project)) {
			return new File(".");
		}
		Optional<Project> projectOpt = projectService.getProject(project);
		if (!projectOpt.isPresent()) {
			String message = MessageFormat.format("No project {0} configured!", project);
			throw new RuntimeException(message);
		}
		return new File(projectOpt.get().getPath());
	}

	protected void writeToFile(String project, String filePath, String content) throws IOException {
		File mdFile = toMdFile(project, filePath);
		File mdFileParent = mdFile.getParentFile();
		if (!mdFileParent.exists()) {
			mdFileParent.mkdirs();
		}
		FileWriter readMeWriter = new FileWriter(mdFile, false);
		readMeWriter.write(content);
		readMeWriter.close();
	}

	protected File toMdFile(String project, String filePath) throws IOException {

		File projectRootFolder = getProjectRootFolder(project);

		if (!filePath.startsWith(".")) {
			if (!filePath.startsWith("/")) {
				filePath = "/" + filePath;
			}
			filePath = "." + filePath;
		}

		return new File(projectRootFolder, filePath + MD_EXTENSION).getCanonicalFile().getAbsoluteFile();
	}

	protected String readFromFile(String project, String filePath) throws IOException {
		File mdFile = toMdFile(project, filePath);
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
