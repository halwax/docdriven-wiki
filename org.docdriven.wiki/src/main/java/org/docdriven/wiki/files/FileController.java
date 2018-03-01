package org.docdriven.wiki.files;

import java.io.BufferedOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.text.MessageFormat;
import java.util.Optional;

import javax.servlet.http.HttpServletRequest;

import org.docdriven.wiki.project.Project;
import org.docdriven.wiki.project.ProjectService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.PathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
public class FileController {

	@Autowired
	private ProjectService projectService;

	@PostMapping("/api/files/projects/{project}/**")
	public void postFile(@PathVariable String project, @RequestParam("file") MultipartFile file,
			HttpServletRequest request) throws IOException {
		this.writeToFile(project, extractPath(project, request.getRequestURI()), file);
	}

	private String extractPath(String project, String requestURI) {
		return requestURI.substring(("api/files/projects/" + project + "/").length());
	}

	@GetMapping("/api/files/projects/{project}/**")
	@ResponseBody
	public ResponseEntity<Resource> getDocument(@PathVariable String project, HttpServletRequest request)
			throws IOException {
		Optional<Resource> resourceOpt = readFromFile(project, extractPath(project, request.getRequestURI()));
		if (resourceOpt.isPresent()) {
			return ResponseEntity.ok(resourceOpt.get());
		}
		return ResponseEntity.notFound().build();
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

	protected void writeToFile(String project, String filePath, MultipartFile multiPartFile) throws IOException {
		File file = toFile(project, filePath);
		File mdFileParent = file.getParentFile();
		if (!mdFileParent.exists()) {
			mdFileParent.mkdirs();
		}
		OutputStream out = new BufferedOutputStream(new FileOutputStream(file));
		out.write(multiPartFile.getBytes());
		out.close();
	}

	protected File toFile(String project, String filePath) throws IOException {

		File projectRootFolder = getProjectRootFolder(project);

		if (!filePath.startsWith(".")) {
			if (!filePath.startsWith("/")) {
				filePath = "/" + filePath;
			}
			filePath = "." + filePath;
		}

		return new File(projectRootFolder, filePath).getCanonicalFile().getAbsoluteFile();
	}

	protected Optional<Resource> readFromFile(String project, String filePath) throws IOException {
		File file = toFile(project, filePath);
		if (file.exists()) {
			return Optional.of(new PathResource(file.toPath()));
		}
		return Optional.empty();
	}

}
